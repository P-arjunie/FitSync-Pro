// app/api/analytics/platform-usage/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LoginHistory from "@/models/LoginHistory";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export async function GET() {
  try {
    await connectToDatabase();

    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    // --- 1. Logins Over Time (Last 6 Months) ---
    const loginsOverTime = await LoginHistory.aggregate([
      { $match: { timestamp: { $gte: sixMonthsAgo }, status: "success" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for Chart.js
    const labels = [];
    const counts = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        labels.push(new Date(monthKey).toLocaleString('default', { month: 'short' }));
        const monthData = loginsOverTime.find(item => item._id === monthKey);
        counts.push(monthData ? monthData.count : 0);
    }

    // --- 2. Key Metrics (Last 30 Days) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalLogins30d = await LoginHistory.countDocuments({
      timestamp: { $gte: thirtyDaysAgo },
      status: "success",
    });
    const failedLogins30d = await LoginHistory.countDocuments({
      timestamp: { $gte: thirtyDaysAgo },
      status: "failure",
    });

    // --- 3. DAU and MAU ---
    const today = new Date();
    const dau = await LoginHistory.distinct("userId", {
        timestamp: { $gte: new Date(today.setHours(0, 0, 0, 0)) },
        status: "success"
    }).countDocuments();

    const mau = await LoginHistory.distinct("userId", {
        timestamp: { $gte: thirtyDaysAgo },
        status: "success"
    }).countDocuments();

    // --- 4. Role Breakdown ---
    const roleBreakdownData = await LoginHistory.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$userId" } }, // Get unique users
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