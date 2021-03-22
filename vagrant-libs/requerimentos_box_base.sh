#!/bin/bash

echo "==> Atualizar os repositórios do $HOSTNAME ..."
sudo apt update && sudo apt upgrade -y

echo "==> Instalar os pacotes base no $HOSTNAME..."
sudo apt-get install -y \
    linux-generic \
    linux-headers-`uname -r` \
    ubuntu-minimal \
    dkms \
    autoconf \
    build-essential \
    make \
    virtualbox virtualbox-guest-dkms virtualbox-guest-additions-iso