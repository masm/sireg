# sireg

> Simple registration of docker containers in Consul

This is the implementation of a simple registry service inspired by
[registrator](https://github.com/gliderlabs/registrator).

It handle a single use case: registering containers in Consul, using the containers internal
IP.  It was created because, at the time, `registrator` implementation had a bug for this
specific use case.

You should consider not using this and use `registrator` instead, if it works for you.

## Install

Pull this image with `docker pull masm/sireg`.


## Usage

Run it with `docker run masm/sireg`.

Although this is very similar to registrator, there are some small differences:

  - You have to explicitly use environment variable for all services you want to register:
    not specifying any environment variable will not register any service;

  - You have to specify the port in the environment variable name; `SERVICE_NAME` does not
    work.  You need to have one `SERVICE_<PORT>_NAME` for each port you want to export.

  - The key of the service used in consul uses the service name and the port number.  If you
    have two similar services in the same host (same service name and port number), one will
    override the other.  You can use `SERVICE_<PORT>_DESCRIMINATOR` to handle that.  It
    works as `SERVICE_<PORT>_TAGS`, except that that value is also used in the Consul's
    service name, allowing you to have two instances of a service running in the same host.


## License

Copyright (c) 2016 Marco Monteiro. Released under the MIT license. See `LICENSE` file for details.
