#!/bin/bash

source .variaveis_ambiente_vps_dev

echo "Iniciando a compilação da imagem ISO do NFDOS $NFDOS_VERSAO ..."

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

if [ "$VERSAO_BOX_VAGRANT" == "virtualbox" ]; 
then
	echo "Checkando se a $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box existe..."
	if [ ! -f "$NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box" ]; 
	then
		echo "A $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box não existe. Criando ela..."

		echo "Checkando o SHA256 da imagem ISO..."
		checkar_sha256=$(sha256sum $NFDOS_ROOT/nfdos.iso | awk '{ print $1 }')
		jq ".variables.iso_checksum = \"$checkar_sha256\"" $NFDOS_HOME/desktop/virtualbox.json | sponge $NFDOS_HOME/desktop/virtualbox.json

		cd $NFDOS_HOME/desktop
		packer build virtualbox.json #VBoxManage setextradata VM-name "VBoxInternal/TM/TSCTiedToExecution" 1
		cd $NEORICALEX_HOME
	fi
	echo "A $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box existe."

elif [ "$VERSAO_BOX_VAGRANT" == "libvirt" ];
then
	echo "Checkando se a $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box existe..."
	if [ ! -f "$NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box" ]; then

		echo "A $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box não existe. Criando ela..."

		echo "Checkando o SHA256 da imagem ISO..."
		checkar_sha256=$(sha256sum $NFDOS_ROOT/nfdos.iso | awk '{ print $1 }')
		jq ".variables.iso_checksum = \"$checkar_sha256\"" $NFDOS_HOME/desktop/libvirt.json | sponge $NFDOS_HOME/desktop/libvirt.json

		cd $NFDOS_HOME/desktop
		PACKER_LOG=1 packer build libvirt.json # PACKER_LOG=1
		cd $NEORICALEX_HOME
	fi
	echo "A $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box já existe."
else
    echo "A versão $VERSAO_BOX_VAGRANT do vagrant não é suportada."
fi
