FROM rust:1.74.0 as builder
LABEL authors="altrius"

WORKDIR /app

COPY ./src ./src
COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock

RUN cargo build --release

FROM rust:1.74.0 as runtime
LABEL authors="altrius"
COPY --from=builder /app/target/release/thud /usr/local/bin/thud

ENTRYPOINT ["/usr/local/bin/thud"]