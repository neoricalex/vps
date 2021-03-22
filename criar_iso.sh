#!/bin/bash

# NEORICALEX
export NEORICALEX_HOME=$(pwd)
# NFDOS
export NFDOS_HOME=$NEORICALEX_HOME/nfdos
export NFDOS_VERSAO="0.4.4"
# NFDOS Core
export NFDOS_ROOT=$NFDOS_HOME/core
export NFDOS_ROOTFS=$NFDOS_ROOT/rootfs
export NFDOS_DISCO=$NFDOS_ROOT/nfdos.img

echo "Iniciando a criação da imagem ISO do NFDOS $NFDOS_VERSAO ..."

echo "Atualizar repositórios e instalar requerimentos..."
sudo apt update
sudo apt install -y \
    binutils \
    debootstrap \
    squashfs-tools \
    xorriso \
    grub-pc-bin \
    grub-efi-amd64-bin \
    unzip \
    mtools \
    whois \
    jq \
    moreutils

if ! command -v packer &> /dev/null
then
    versao_packer="1.6.4"
    wget https://releases.hashicorp.com/packer/${versao_packer}/packer_${versao_packer}_linux_amd64.zip
    unzip packer_${versao_packer}_linux_amd64.zip
    sudo mv packer /usr/local/bin 
    rm packer_${versao_packer}_linux_amd64.zip
fi

echo "Checkando se a $NFDOS_HOME existe"
if [ ! -d "$NFDOS_HOME" ]; then
    mkdir -p $NFDOS_HOME
    mkdir -p $NFDOS_HOME/core
    mkdir -p $NFDOS_HOME/desktop
fi

echo "Checkando se a $NFDOS_ROOT/nfdos.iso existe"
if [ ! -f "$NFDOS_ROOT/nfdos.iso" ]; then
    echo "A $NFDOS_ROOT/nfdos.iso não existe. Criando ela..."
    bash "$NFDOS_ROOT/criar_iso.sh"
else
    echo "A $NFDOS_ROOT/nfdos.iso existe"
fi

echo "Checkando se a $NFDOS_HOME/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box existe"
if [ ! -f "$NFDOS_HOME/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box" ]; then

    echo "A $NFDOS_HOME/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box não existe. Criando ela..."

    echo "Checkando o SHA256 da imagem ISO..."
    checkar_sha256=$(sha256sum $NFDOS_ROOT/nfdos.iso | awk '{ print $1 }')
    jq ".variables.iso_checksum = \"$checkar_sha256\"" $NFDOS_HOME/desktop/desktop.json | sponge $NFDOS_HOME/desktop/desktop.json

    cd $NFDOS_HOME/desktop
    packer build desktop.json #VBoxManage setextradata VM-name "VBoxInternal/TM/TSCTiedToExecution" 1
    cd $NEORICALEX_HOME
    
else
    echo "A $NFDOS_HOME/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box existe."

fi