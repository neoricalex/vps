#!/bin/bash

echo "Parece Bom"
touch $HOME/testado

exit 

echo "==> Atualizando os pacotes do Ubuntu"
apt update && apt upgrade -y

echo "==> Instalar pacotes para desenvolvimento geral..."
apt-get install -y build-essential checkinstall libreadline-gplv2-dev \
	libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev \
	libbz2-dev libffi-dev python3-pip unzip lsb-release software-properties-common \
	curl wget git rsync devscripts python-dev python3-venv \
	qemu-system qemu qemu-kvm qemu-utils qemu-block-extra \
	libvirt-daemon libvirt-daemon-system libvirt-clients \
	cpu-checker libguestfs-tools libosinfo-bin \
	bridge-utils dnsmasq-base ebtables libvirt-dev ruby-dev \
	ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev

if ! command -v vboxmanage &> /dev/null;
then
	echo "==> Instalar o VirtualBox"
	echo "deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib" | sudo tee /etc/apt/sources.list.d/virtualbox.list
	wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
	wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
	apt-get update
	apt-get install virtualbox-6.1 -y
	apt install -y virtualbox-guest-dkms #virtualbox-guest-x11
	apt install -y virtualbox-guest-additions-iso

	echo "==> Instalar o Extension Pack do VirtualBox"
	wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack \
		-q --show-progress \
		--progress=bar:force:noscroll
	vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
	rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 
fi

if ! command -v vagrant &> /dev/null;
then
	echo "==> Instalar Vagrant"
	wget -nv https://releases.hashicorp.com/vagrant/2.2.14/vagrant_2.2.14_x86_64.deb
	dpkg -i vagrant_2.2.14_x86_64.deb
	rm vagrant_2.2.14_x86_64.deb

	echo "==> Instalar plugins do Vagrant"
	vagrant plugin install vagrant-libvirt
	vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
	vagrant plugin install vagrant-mutate
fi

echo "==> Removendo pacotes do Ubuntu desnecessários"
apt autoremove -y
