use chrono::Utc;

public_struct! {
    pub struct UserBase {
        username: String
    }
}

UserBase! {
    pub struct UserLogin {
        pub password: String,
    }
}

UserBase! {
    pub struct StoredUser {
        pub email: String,
        pub email_verified: bool,
        pub display_name: String,
        pub hash: String,
        pub created: chrono::DateTime<Utc>,
    }
}

UserBase! {
    pub struct UserCreate {
        pub email: String,
        pub hash: String,
    }
}