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

    // --- 1. Logins Over Time (filtered) ---
    const match: any = { timestamp: { $gte: sixMonthsAgo, $lte: endOfCurrentMonth }, status: "success" };
    if (roleParam && roleParam !== "all") {
      // Need to lookup user role
      // We'll filter after aggregation for performance
    }
    const loginsOverTime = await LoginHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
          userId: { $first: "$userId" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      ...(roleParam && roleParam !== "all"
        ? [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails"
              }
            },
            { $unwind: "$userDetails" },
            { $match: { "userDetails.role": roleParam } },
          ]
        : []),
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
    if (roleParam && roleParam !== "all") keyMatch.status = "success";

    let userIds: any[] = [];
    if (roleParam && roleParam !== "all") {
      // Find userIds with that role
      const users = await (await import("@/models/User")).default.find({ role: roleParam }, { _id: 1 });
      userIds = users.map((u: any) => u._id);
      keyMatch.userId = { $in: userIds };
      match.userId = { $in: userIds };
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
    const roleBreakdownData = await LoginHistory.aggregate([
      { $match: { status: "success", ...(keyStart ? { timestamp: { $gte: keyStart, $lte: keyEnd } } : {}) } },
      { $group: { _id: "$userId" } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $group: { _id: "$userDetails.role", count: { $sum: 1 } } }
    ]);
    const roleBreakdown = roleBreakdownData.reduce((acc, item) => {
      acc[item._id] = item.count;
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
      { error: "Failed to fetch platform usage data." },
      { status: 500 }
    );
  }
}