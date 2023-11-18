use std::collections::HashMap;
use std::net::{IpAddr, Ipv6Addr};

use serde::{Deserialize, Serialize};

use crate::protocol::enums::AuthType;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AuthPayload {
    pub auth_type: String,
    pub auth_data: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponsePayload {
    pub authenticated: bool,
    pub error: Option<String>,
}


#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WelcomePayload {
    pub thud: String,
    pub node: String,
}


#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SocketStateInformation {
    pub authenticated: bool,
    pub auth_method: Option<AuthType>,
    pub subscriptions: HashMap<String, bool>,
    pub is_federated: bool,
    pub federation_ip: Option<Ipv6Addr>,
    pub connection_ip: Option<IpAddr>,
}

impl SocketStateInformation {
    pub fn new() -> SocketStateInformation {
        return SocketStateInformation {
            authenticated: false,
            auth_method: None,
            subscriptions: HashMap::new(),
            is_federated: false,
            federation_ip: None,
            connection_ip: None,
        };
    }
}