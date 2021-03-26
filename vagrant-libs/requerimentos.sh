#!/bin/bash

cd /neoricalex

source .variaveis_ambiente_vps_dev

echo "==> Checkando se os requerimentos foram instalados..."
if [ ! -f ".requerimentos_iso.box" ]; 
then
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
		moreutils \
		make

	echo "==> Instalar o Linux/Ubuntu base..."
	sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

	echo "==> Instalar o VirtualBox"
	#sudo apt install -y virtualbox
	deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib
	wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
	wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
	sudo apt-get update
	sudo apt-get install virtualbox-6.1 -y
	sudo apt install -y virtualbox-guest-dkms #virtualbox-guest-x11
	sudo apt install -y virtualbox-guest-additions-iso

	echo "==> Instalar o Extension Pack do VirtualBox"
	wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack \
		-q --show-progress \
		--progress=bar:force:noscroll
	sudo vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
	rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 

	if ! command -v vagrant &> /dev/null
	then
		echo "Download Vagrant & Instalar"
		wget -nv https://releases.hashicorp.com/vagrant/2.2.9/vagrant_2.2.9_x86_64.deb
		sudo dpkg -i vagrant_2.2.9_x86_64.deb
		rm vagrant_2.2.9_x86_64.deb

		echo "Instalar plugins do Vagrant"
		vagrant plugin install vagrant-libvirt
		
	fi

	if ! command -v packer &> /dev/null
	then
		versao_packer="1.6.4"
		wget https://releases.hashicorp.com/packer/${versao_packer}/packer_${versao_packer}_linux_amd64.zip
		unzip packer_${versao_packer}_linux_amd64.zip
		sudo mv packer /usr/local/bin 
		rm packer_${versao_packer}_linux_amd64.zip
	fi

    echo "==> Removendo pacotes desnecessários"
    sudo apt autoremove -y
    touch .requerimentos_iso.box
fi
