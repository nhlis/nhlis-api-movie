export enum EExpirationTime {
    SECOND = 1000,
    MINUTE = 60 * EExpirationTime.SECOND,
    HOUR = 60 * EExpirationTime.MINUTE,
    DAY = 24 * EExpirationTime.HOUR,

    ACCESS_TOKEN = 1 * EExpirationTime.DAY, // 1 ngày
    REFRESH_TOKEN = 30 * EExpirationTime.DAY, // 30 ngày
    SESSION = 2 * 365 * EExpirationTime.DAY, // 2 năm
    ID_TOKEN = 1 * EExpirationTime.HOUR, // 1 giờ
    CODE = 5 * EExpirationTime.MINUTE, // 5 phút
}
