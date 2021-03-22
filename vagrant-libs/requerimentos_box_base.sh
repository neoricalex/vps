#!/bin/bash

#echo "==> Criar a pasta compartilhada ..."
#mkdir -p /home/vagrant/src
#mount.vboxsf -o "uid=1000,gid=1000,dev,exec,rw" pasta_compartilhada /home/vagrant/src

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