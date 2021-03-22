ARG BASE_IMAGE=ubuntu:20.04
FROM $BASE_IMAGE

ARG QEMU_ARCH
ADD x86_64_qemu-${QEMU_ARCH}-static.tar.gz /usr/bin

COPY . /bd_build

RUN /bd_build/prepare.sh && \
	/bd_build/system_services.sh && \
	/bd_build/utilities.sh && \
	/bd_build/cleanup.sh && \
    /bd_build/iniciar.sh

ENV DEBIAN_FRONTEND="teletype" \
    LANG="pt_BR.UTF-8" \
    LANGUAGE="pt_BR:br" \
    LC_ALL="pt_BR.UTF-8"

CMD ["/sbin/my_init"]
