use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum AuthType {
    Whenplane,
    Federation,
    Custom,
    Unknown,
}


impl Default for AuthType {
    fn default() -> Self {
        AuthType::Unknown
    }
}

impl AuthType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "whenplane" => AuthType::Whenplane,
            "federation" => AuthType::Federation,
            "custom" => AuthType::Custom,
            _ => AuthType::Unknown,
        }
    }

    // pub fn as_str(&self) -> &str {
    //     match self {
    //         AuthType::Whenplane => "whenplane",
    //         AuthType::Federation => "federation",
    //         AuthType::Custom => "custom",
    //         AuthType::Unknown => "unknown",
    //     }
    // }
}

