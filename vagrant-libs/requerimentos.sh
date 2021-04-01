#!/bin/bash

echo "==> Gerar e configurar o idioma pt_BR"
DEBIAN_FRONTEND="teletype" \
    LANG="pt_BR.UTF-8" \
    LANGUAGE="pt_BR:br" \
    LC_ALL="pt_BR.UTF-8"

locale-gen --purge $LANG
update-locale LANG=$LANG LC_ALL=$LC_ALL LANGUAGE=$LANGUAGE

sudo apt update && sudo apt install -y `check-language-support -l pt_BR`


echo "Atualizar repositórios e pacotes..."

sudo rm /etc/apt/sources.list
sudo bash -c 'cat > /etc/apt/sources.list' <<REPOSITORIOS
# deb cdrom:[Ubuntu 20.04 LTS _Focal Fossa_ - Release amd64 (20200423)]/ focal main restricted

# See http://help.ubuntu.com/community/UpgradeNotes for how to upgrade to
# newer versions of the distribution.
deb http://br.archive.ubuntu.com/ubuntu/ focal main restricted
deb-src http://br.archive.ubuntu.com/ubuntu/ focal main restricted

## Major bug fix updates produced after the final release of the
## distribution.
deb http://br.archive.ubuntu.com/ubuntu/ focal-updates main restricted
deb-src http://br.archive.ubuntu.com/ubuntu/ focal-updates main restricted

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu
## team. Also, please note that software in universe WILL NOT receive any
## review or updates from the Ubuntu security team.
deb http://br.archive.ubuntu.com/ubuntu/ focal universe
deb-src http://br.archive.ubuntu.com/ubuntu/ focal universe
deb http://br.archive.ubuntu.com/ubuntu/ focal-updates universe
deb-src http://br.archive.ubuntu.com/ubuntu/ focal-updates universe

## N.B. software from this repository is ENTIRELY UNSUPPORTED by the Ubuntu 
## team, and may not be under a free licence. Please satisfy yourself as to 
## your rights to use the software. Also, please note that software in 
## multiverse WILL NOT receive any review or updates from the Ubuntu
## security team.
deb http://br.archive.ubuntu.com/ubuntu/ focal multiverse
deb-src http://br.archive.ubuntu.com/ubuntu/ focal multiverse
deb http://br.archive.ubuntu.com/ubuntu/ focal-updates multiverse
deb-src http://br.archive.ubuntu.com/ubuntu/ focal-updates multiverse

## N.B. software from this repository may not have been tested as
## extensively as that contained in the main release, although it includes
## newer versions of some applications which may provide useful features.
## Also, please note that software in backports WILL NOT receive any review
## or updates from the Ubuntu security team.
deb http://br.archive.ubuntu.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://br.archive.ubuntu.com/ubuntu/ focal-backports main restricted universe multiverse

## Uncomment the following two lines to add software from Canonical's
## 'partner' repository.
## This software is not part of Ubuntu, but is offered by Canonical and the
## respective vendors as a service to Ubuntu users.
# deb http://archive.canonical.com/ubuntu focal partner
deb-src http://archive.canonical.com/ubuntu focal partner

deb http://security.ubuntu.com/ubuntu focal-security main restricted
deb-src http://security.ubuntu.com/ubuntu focal-security main restricted
deb http://security.ubuntu.com/ubuntu focal-security universe
deb-src http://security.ubuntu.com/ubuntu focal-security universe
deb http://security.ubuntu.com/ubuntu focal-security multiverse
deb-src http://security.ubuntu.com/ubuntu focal-security multiverse

# This system was installed using small removable media
# (e.g. netinst, live or single CD). The matching "deb cdrom"
# entries were disabled at the end of the installation process.
# For information about how to configure apt package sources,
# see the sources.list(5) manual.
REPOSITORIOS

sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade

echo "==> Instalar o Linux/Ubuntu base..."
sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

if ! command -v unzip &> /dev/null;
then
	echo "==> Instalar pacotes para a criação da imagem ISO..."
	sudo apt install -y \
		binutils \
		debootstrap \
		squashfs-tools \
		xorriso \
		grub-pc-bin \
		grub-efi-amd64-bin \
		mtools \
		whois \
		jq \
		moreutils \
		make \
		unzip
fi

if ! command -v kvm-ok &> /dev/null;
then
	echo "==> Instalar os pacotes do kvm"
	sudo apt install -y qemu-system qemu qemu-kvm qemu-utils qemu-block-extra \
						libvirt-daemon libvirt-daemon-system libvirt-clients \
						cpu-checker libguestfs-tools libosinfo-bin \
						bridge-utils dnsmasq-base ebtables libvirt-dev

	sudo usermod -aG kvm vagrant
	sudo usermod -aG libvirt vagrant

	sudo chown root:kvm /dev/kvm
	sudo chmod -R 660 /dev/kvm
	sudo udevadm control --reload-rules
	sudo systemctl restart libvirtd
fi

if ! command -v vboxmanage &> /dev/null;
then
	echo "==> Instalar o VirtualBox"
	echo "deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib" | sudo tee /etc/apt/sources.list.d/virtualbox.list
	wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
	wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
	sudo apt-get update
	sudo apt-get install virtualbox -y
	sudo apt install -y virtualbox-guest-dkms #virtualbox-guest-x11
	sudo apt install -y virtualbox-guest-additions-iso

	echo "==> Instalar o Extension Pack do VirtualBox"
	wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack \
		-q --show-progress \
		--progress=bar:force:noscroll
	sudo vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
	rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 
fi 

if ! command -v packer &> /dev/null;
then
	echo "==> Instalar Packer"
	wget https://releases.hashicorp.com/packer/1.6.4/packer_1.6.4_linux_amd64.zip
	unzip packer_1.6.4_linux_amd64.zip
	sudo mv packer /usr/local/bin 
	rm packer_1.6.4_linux_amd64.zip
fi
sudo apt remove vagrant* -y 
vagrant plugin expunge --force
sudo apt autoremove -y

if ! command -v vagrant &> /dev/null;
then
	echo "==> Download Vagrant & Instalar"
	wget -nv https://releases.hashicorp.com/vagrant/2.2.14/vagrant_2.2.14_x86_64.deb
	sudo dpkg -i vagrant_2.2.14_x86_64.deb
	rm vagrant_2.2.14_x86_64.deb

	echo "==> Instalar requerimentos dos plugins do Vagrant"
	sudo apt install -y \
		ruby-dev ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev libvirt-dev zlib1g-dev
		
	sudo apt install -y build-dep 

fi

echo "==> Remover entradas antigas do kernel na Grub..."
# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
sudo apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y

echo "==> Removendo pacotes desnecessários"
sudo apt autoremove -y
