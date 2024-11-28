public record DailyStats(
        long totalUsers,
        long dailyActiveUsers,
        long weeklyActiveUsers,
        long monthlyActiveUsers,
        long totalPayments,
        long completedPayments,
        long p2pPayments,
        long storageUnitsPurchased,
        long fanTokensPurchased,
        long mintTokensPurchased,
        long hyperSubscriptions
) {} 
