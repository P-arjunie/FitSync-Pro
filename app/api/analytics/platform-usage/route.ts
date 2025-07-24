// app/api/analytics/platform-usage/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LoginHistory from "@/models/LoginHistory";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Parse filters from query
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const roleParam = searchParams.get("role");

    // For logins over time (default: last 6 months)
    let sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    let endOfCurrentMonth = endOfMonth(new Date());
    if (startDateParam) sixMonthsAgo = new Date(startDateParam);
    if (endDateParam) endOfCurrentMonth = new Date(endDateParam);

    // Get user IDs for role filtering if needed
    let userIds: any[] = [];
    if (roleParam && roleParam !== "all") {
      try {
        const User = (await import("@/models/User")).default;
        const users = await User.find({ role: roleParam }, { _id: 1 }).lean();
        userIds = users.map((u: any) => u._id);
        
        // If no users found with this role, return empty data
        if (userIds.length === 0) {
          return NextResponse.json({
            labels: [],
            loginCounts: [],
            totalLogins30d: 0,
            failedLogins30d: 0,
            dau: 0,
            mau: 0,
            roleBreakdown: {},
          });
        }
      } catch (error) {
        console.error("Error fetching users by role:", error);
      }
    }

    // --- 1. Logins Over Time (filtered) ---
    const match: any = {
      timestamp: { $gte: sixMonthsAgo, $lte: endOfCurrentMonth },
      status: "success"
    };
    
    // Add user ID filter if role is specified
    if (userIds.length > 0) {
      match.userId = { $in: userIds };
    }
    
    const loginsOverTime = await LoginHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for Chart.js
    const labels = [];
    const counts = [];
    // Calculate months between start and end
    let months = [];
    let d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);
    let end = new Date(endOfCurrentMonth.getFullYear(), endOfCurrentMonth.getMonth(), 1);
    while (d <= end) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleString('default', { month: 'short' }));
      const monthData = loginsOverTime.find(item => item._id === monthKey);
      counts.push(monthData ? monthData.count : 0);
      d.setMonth(d.getMonth() + 1);
    }

    // --- 2. Key Metrics (Last 30 Days or filtered) ---
    let thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let keyStart = startDateParam ? new Date(startDateParam) : thirtyDaysAgo;
    let keyEnd = endDateParam ? new Date(endDateParam) : new Date();
    const keyMatch: any = { timestamp: { $gte: keyStart, $lte: keyEnd } };
    
    // Add user ID filter if role is specified
    if (userIds.length > 0) {
      keyMatch.userId = { $in: userIds };
    }

    const totalLogins30d = await LoginHistory.countDocuments({ ...keyMatch, status: "success" });
    const failedLogins30d = await LoginHistory.countDocuments({ ...keyMatch, status: "failure" });

    // --- 3. DAU and MAU (filtered) ---
    const today = new Date();
    const dau = await LoginHistory.distinct("userId", {
      timestamp: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: keyEnd },
      status: "success",
      ...(userIds.length ? { userId: { $in: userIds } } : {})
    }).then(arr => arr.length);

    const mau = await LoginHistory.distinct("userId", {
      timestamp: { $gte: keyStart, $lte: keyEnd },
      status: "success",
      ...(userIds.length ? { userId: { $in: userIds } } : {})
    }).then(arr => arr.length);

    // --- 4. Role Breakdown (filtered) ---
    // --- 4. Role Breakdown (filtered) ---
    const roleBreakdownData = await LoginHistory.aggregate([
      {
        $match: {
          status: "success",
          timestamp: { $gte: keyStart, $lte: keyEnd },
          ...(userIds.length > 0 ? { userId: { $in: userIds } } : {})
        }
      },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$userDetails.role", count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } }
    ]);
    const roleBreakdown = roleBreakdownData.reduce((acc, item) => {
      if (item._id) {
        acc[item._id] = item.count;
      }
      return acc;
    }, {});

    return NextResponse.json({
      labels,
      loginCounts: counts,
      totalLogins30d,
      failedLogins30d,
      dau,
      mau,
      roleBreakdown,
    });
  } catch (error) {
    console.error("Platform Usage Analytics Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch platform usage data.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}