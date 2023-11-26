use std::collections::BTreeMap;
use std::sync::Mutex;

use axum::routing::get;
use axum::Server;
use gethostname::gethostname;
use serde_json::Value;
use socketioxide::{
    extract::{AckSender, Bin, Data, SocketRef},
    SocketIo,
};
use tracing::info;
use tracing_subscriber::FmtSubscriber;

use crate::protocol::enums::AuthType;
use crate::protocol::structs::{AuthPayload, AuthResponsePayload, SocketStateInformation, WelcomePayload};

mod protocol;

static mut SOCKET_STATE: Mutex<BTreeMap<String, SocketStateInformation>> = Mutex::new(BTreeMap::new());

fn on_connect(socket: SocketRef, Data(data): Data<Value>) {
    info!("Socket.io connected: {:?} {:?} {:?}", socket.ns(), socket.id, data);
    let welcome: WelcomePayload = WelcomePayload {
        thud: "0.0.1".to_string(),
        node: gethostname().to_string_lossy().to_string(),
    };

    let state = unsafe { SOCKET_STATE.get_mut().unwrap() };
    state.insert(socket.id.clone().to_string(), SocketStateInformation::new());
    // state.get_mut(&socket.id.to_string()).unwrap().connection_ip = Some(socket().unwrap().ip().clone());

    socket.emit("welcome", welcome).ok();

    socket.on_disconnect(|socket, reason| async move {
        info!("Socket.io disconnected: {:?} {:?} {:?}", socket.ns(), socket.id, reason);
        let state = unsafe { SOCKET_STATE.get_mut().unwrap() };
        state.remove(&socket.id.to_string());
    });

    socket.on("login", |socket: SocketRef, Data::<AuthPayload>(data), ack: AckSender| {
        info!("{:?} | Received event: {:?}", socket.id, data);
        let state = unsafe { SOCKET_STATE.get_mut().unwrap() };
        match AuthType::from_str(data.auth_type.as_str()) {
            AuthType::Whenplane => {
                info!("Client is authenticating with whenplane");
                state.get_mut(&socket.id.to_string()).unwrap().authenticated = true;
                state.get_mut(&socket.id.to_string()).unwrap().auth_method = Some(AuthType::Whenplane);
                ack.send(AuthResponsePayload {
                    authenticated: true,
                    error: None,
                }).ok();
            }

            AuthType::Federation => {
                info!("Client is authenticating with federation");

                if data.auth_data.is_none() {
                    info!("Client is trying to authenticate with federation, but no auth data was provided");
                    state.get_mut(&socket.id.to_string()).unwrap().authenticated = false;
                    state.get_mut(&socket.id.to_string()).unwrap().auth_method = Some(AuthType::Federation);
                    ack.send(AuthResponsePayload {
                        authenticated: false,
                        error: Some("No auth data provided".to_string()),
                    }).ok();
                    socket.disconnect().ok();
                    return;
                }

                state.get_mut(&socket.id.to_string()).unwrap().authenticated = true;
                state.get_mut(&socket.id.to_string()).unwrap().auth_method = Some(AuthType::Federation);
                // state.get_mut(&socket.id.to_string()).unwrap().is_federated = true;
                // state.get_mut(&socket.id.to_string()).unwrap().federation_ip = Some(data.auth_data.unwrap().parse().unwrap());
                ack.send(AuthResponsePayload {
                    authenticated: true,
                    error: None,
                }).ok();
            }

            AuthType::Unknown | AuthType::Custom => {
                info!("Client is trying to authenticate using unknown method: {:?}", data.auth_type);
                state.get_mut(&socket.id.to_string()).unwrap().authenticated = false;
                state.get_mut(&socket.id.to_string()).unwrap().auth_method = Some(AuthType::Unknown);
                ack.send(AuthResponsePayload {
                    authenticated: false,
                    error: Some("Unknown authentication method".to_string()),
                }).ok();
                socket.disconnect().ok();
            }
        };
    });

    socket.on("peers", |socket: SocketRef, Data::<Value>(_data), ack: AckSender| {
        let state = unsafe { SOCKET_STATE.get_mut().unwrap() };
        if !state.get(&socket.id.to_string()).unwrap().authenticated {
            info!("Client is not authenticated, disconnecting");
            socket.disconnect().ok();
            return;
        }

        let mut peers: Vec<SocketStateInformation> = Vec::new();
        for (_id, peer) in state.iter() {
            if peer.authenticated {
                peers.push(peer.clone());
            }
        }

        ack.send({
            peers
        }).ok();
    });

    socket.on("message", |socket: SocketRef, Data::<Value>(data), Bin(bin)| {
        info!("Received event: {:?} {:?}", data, bin);
        socket.bin(bin).emit("message-back", data).ok();
    });

    socket.on("message-with-ack", |Data::<Value>(data), ack: AckSender, Bin(bin)| {
        info!("Received event: {:?} {:?}", data, bin);
        ack.bin(bin).send(data).ok();
    });
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (layer, io) = SocketIo::new_layer();

    io.ns("/", on_connect);
    io.ns("/custom", on_connect);

    let app = axum::Router::new()
        .route("/", get(|| async { "This server is running socket.io, please connect via that." }))
        .layer(layer);

    info!("Starting server");

    Server::bind(&"0.0.0.0:3001".parse().unwrap())
        .serve(app.into_make_service())
        .await?;

    Ok(())
}