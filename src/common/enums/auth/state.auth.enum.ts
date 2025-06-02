export enum EAuthState {
    SIGNED_IN = 'signed_in', // Tài khoản đang đăng nhập
    SIGNED_OUT = 'signed_out', // Tài khoản đã đăng xuất
    INACTIVE = 'inactive', // Tài khoản đã đăng nhập nhưng không hoạt động
    SESSION_EXPIRED = 'session_expired', // Phiên đăng nhập đã hết hạn
}
