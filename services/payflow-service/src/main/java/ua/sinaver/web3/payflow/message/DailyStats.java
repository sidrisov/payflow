package ua.sinaver.web3.payflow.message;

public record DailyStats(
        long totalUsers,
        long dailyActiveUsers,
        long weeklyActiveUsers,
        long monthlyActiveUsers,
        long totalPayments,
        long completedPayments,
        long storageUnitsPurchased
) {
}
