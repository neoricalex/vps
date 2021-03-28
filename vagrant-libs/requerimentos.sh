#!/bin/bash

cd /neoricalex

source .variaveis_ambiente_vps_dev

echo "==> Checkando se os requerimentos foram instalados..."
if [ ! -f ".requerimentos_iso.box" ]; 
then
	echo "Atualizar repositórios e pacotes..."
	sudo apt-get update
	sudo apt-get -y upgrade
	sudo apt-get -y dist-upgrade

	echo "==> Instalar o Linux/Ubuntu base..."
	sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

	echo "==> Instalar pacotes para a criação da imagem ISO..."
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

	echo "==> Instalar pacotes para desenvolvimento geral..."
	sudo apt-get install -y build-essential checkinstall libreadline-gplv2-dev \
		libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev \
		libbz2-dev libffi-dev python3-pip unzip lsb-release software-properties-common \
		curl wget git rsync devscripts python-dev python3-venv

	echo "==> Instalar o VirtualBox"
	echo "deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib" | sudo tee /etc/apt/sources.list.d/virtualbox.list
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

	echo "==> Download Vagrant & Instalar"
	wget -nv https://releases.hashicorp.com/vagrant/2.2.14/vagrant_2.2.14_x86_64.deb
	sudo dpkg -i vagrant_2.2.14_x86_64.deb
	rm vagrant_2.2.14_x86_64.deb

	echo "==> Instalar plugins do Vagrant"
	vagrant plugin install vagrant-libvirt
	vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
	vagrant plugin install vagrant-mutate

	echo "==> Instalar Packer"
	versao_packer="1.6.4"
	wget https://releases.hashicorp.com/packer/${versao_packer}/packer_${versao_packer}_linux_amd64.zip
	unzip packer_${versao_packer}_linux_amd64.zip
	sudo mv packer /usr/local/bin 
	rm packer_${versao_packer}_linux_amd64.zip

	echo "==> Adicionar o grupo kvm"
	sudo groupadd kvm

	echo "==> Adicionar o usuário vagrant ao grupo kvm"
	sudo usermod -aG kvm vagrant

	echo "==> Instalar os pacotes do kvm"
	sudo apt install -y qemu-system qemu qemu-kvm qemu-utils qemu-block-extra \
						libvirt-daemon libvirt-daemon-system libvirt-clients \
						cpu-checker libguestfs-tools libosinfo-bin \
						bridge-utils dnsmasq-base ebtables libvirt-dev ruby-dev \
						ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev
						#qemu-user-static libvirt-bin build-dep

	echo "==> Adicionar o usuário vagrant ao grupo libvirt"
	sudo usermod -aG libvirt vagrant

	echo "==> Iniciar o serviço KVM de forma automática"
	sudo systemctl start libvirtd
	sudo systemctl enable --now libvirtd

	echo "==> Reiniciar o serviço libvirt"
	sudo systemctl restart libvirtd.service

	echo "==> Habilitar o IPv4 e IPv6 forwarding"
	sudo sed -i "/net.ipv4.ip_forward=1/ s/# *//" /etc/sysctl.conf
	sudo sed -i "/net.ipv6.conf.all.forwarding=1/ s/# *//" /etc/sysctl.conf

	echo "==> Aplicar as mudanças"
	sudo sysctl -p

	echo "==> Instalar Docker..."
	sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
	sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
	sudo apt-get update
	sudo apt-cache policy docker-ce
	sudo apt-get install -y docker-ce docker-compose
	# Re-instalar docker-compose # WORKAROUND: https://github.com/docker/for-linux/issues/563
	# docker build -t terraform-azure-vm . >> "free(): invalid pointer"
	sudo apt-get remove -y golang-docker-credential-helpers
	sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
	echo '{"experimental": true}' > /etc/docker/daemon.json
	service docker restart

	echo "==> Adicionar o usuário vagrant ao grupo docker"
	sudo usermod -aG docker vagrant

	echo "==> Instalar Wireguard..."
	sudo apt install wireguard -y
	sudo cp /neoricalex/vagrant-libs/ssh/digital-ocean/wireguard/cliente/wg0.conf /etc/wireguard/wg0.conf
	sleep 10
	sudo wg-quick up wg0

	echo "==> Remover entradas antigas do kernel na Grub..."
	# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
	sudo apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y	

    echo "==> Removendo pacotes desnecessários"
    sudo apt autoremove -y
    touch .requerimentos_iso.box
fi

