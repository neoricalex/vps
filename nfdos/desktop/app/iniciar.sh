#!/bin/bash 

echo "Parece bom!"

exit

IP_MSG="$(curl --no-progress-meter http://ifconfig.io 2>&1)"
STATUS=$? 

if [ $STATUS -ne 0 ]; then
    MESSAGE="Error Occurred! [ $IP_MSG ]"
    zenity --notification --window-icon=error --text="$MESSAGE"
else
    MESSAGE="My Public IP: $IP_MSG"
    zenity --info --text="$MESSAGE"
fi
echo $MESSAGE

rm /etc/apt/sources.list
cat > /etc/apt/sources.list <<REPOSITORIOS
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

apt-get update
apt-get -y upgrade
apt-get -y dist-upgrade

echo "==> Instalar o Linux/Ubuntu base..."
apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

echo "==> Instalar pacotes para a criação da imagem ISO..."
apt install -y \
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
	make

echo "==> Instalar pacotes para desenvolvimento geral..."
sudo apt-get install -y build-essential checkinstall libreadline-gplv2-dev \
	libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev \
	libbz2-dev libffi-dev python3-pip unzip lsb-release software-properties-common \
	rsync devscripts python-dev python3-venv php-cli unzip \
	libz-dev libssl-dev libcurl4-gnutls-dev libexpat1-dev gettext cmake gcc

echo "==> Instalar os pacotes do kvm"
apt install -y qemu-system qemu qemu-kvm qemu-utils qemu-block-extra \
					libvirt-daemon libvirt-daemon-system libvirt-clients \
					cpu-checker libguestfs-tools libosinfo-bin \
					bridge-utils dnsmasq-base ebtables libvirt-dev

usermod -aG kvm neo
usermod -aG libvirt neo

chown root:kvm /dev/kvm
chmod -R 660 /dev/kvm
udevadm control --reload-rules
systemctl restart libvirtd

echo "==> Adicionar o grupo kvm"
groupadd kvm

echo "==> Adicionar o usuário neo ao grupo kvm"
usermod -aG kvm neo

echo "==> Adicionar o usuário neo ao grupo libvirt"
usermod -aG libvirt neo

echo "==> Iniciar o serviço KVM de forma automática"
systemctl start libvirtd
systemctl enable --now libvirtd

echo "==> Reiniciar o serviço libvirt"
systemctl restart libvirtd.service

echo "==> Habilitar o IPv4 e IPv6 forwarding"
sed -i "/net.ipv4.ip_forward=1/ s/# *//" /etc/sysctl.conf
sed -i "/net.ipv6.conf.all.forwarding=1/ s/# *//" /etc/sysctl.conf

echo "==> Aplicar as mudanças"
sysctl -p

echo "==> Instalar o VirtualBox"
echo "deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib" | tee /etc/apt/sources.list.d/virtualbox.list
wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
apt-get update
apt-get install virtualbox -y
apt install -y virtualbox-dkms #virtualbox-guest-x11
apt install -y virtualbox-guest-additions-iso

echo "==> Instalar o Extension Pack do VirtualBox"
wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack \
	-q --show-progress \
	--progress=bar:force:noscroll
vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 

echo "==> Instalar Packer"
wget https://releases.hashicorp.com/packer/1.6.4/packer_1.6.4_linux_amd64.zip
unzip packer_1.6.4_linux_amd64.zip
mv packer /usr/local/bin 
rm packer_1.6.4_linux_amd64.zip

echo "==> Download Vagrant & Instalar"
wget -nv https://releases.hashicorp.com/vagrant/2.2.15/vagrant_2.2.15_x86_64.deb
dpkg -i vagrant_2.2.15_x86_64.deb
rm vagrant_2.2.15_x86_64.deb

echo "==> Instalar requerimentos dos plugins do Vagrant"
apt install -y \
	ruby-dev ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev libvirt-dev zlib1g-dev
	
#sudo apt install -y build-dep 

echo "==> Instalar plugins do Vagrant"
vagrant plugin install vagrant-libvirt
vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
vagrant plugin install vagrant-mutate
vagrant plugin install vagrant-bindfs

echo "==> Remover entradas antigas do kernel na Grub..."
# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y

echo "==> Removendo pacotes desnecessários"
apt autoremove -y


echo "==> Instalar pacotes para desenvolvimento geral..."
sudo apt-get install -y build-essential checkinstall libreadline-gplv2-dev \
	libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev \
	libbz2-dev libffi-dev python3-pip unzip lsb-release software-properties-common \
	curl wget git rsync devscripts python-dev python3-venv php-cli unzip \
	libz-dev libssl-dev libcurl4-gnutls-dev libexpat1-dev gettext cmake gcc build-dep 

	#qemu-user-static libvirt-bin 

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
sudo echo '{"experimental": true}' > /etc/docker/daemon.json
sudo service docker restart

echo "==> Adicionar o usuário neo ao grupo docker"
sudo usermod -aG docker neo

echo "==> Instalar o Composer..."
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php

#git config --global user.name "neoricalex"
#git config --global user.email "neo.webmaster.2@gmail.com"

#git clone --depth=1 https://github.com/neoricalex/backend.git
#composer create-project roots/bedrock site

# TODO: Trellis/Bedrock/Wordpress: https://www.youtube.com/watch?v=-pOKTtAfJ8M&ab_channel=WPCasts
# TODO Ainsible Docker Swarm: https://imasters.com.br/devsecops/cluster-de-docker-swarm-com-ansible

if [ ! -f "/etc/wireguard/wg0.conf" ]; then
	echo "==> Instalar Wireguard..."
	sudo apt install wireguard -y
	sudo cp /nfdos/vagrant-libs/ssh/digital-ocean/wireguard/cliente/wg0.conf /etc/wireguard/wg0.conf
	sleep 10
	sudo wg-quick up wg0
fi

echo "==> Remover entradas antigas do kernel na Grub..."
# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
sudo apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y	

echo "==> Removendo pacotes desnecessários"
sudo apt autoremove -y

#ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p'

echo ""
echo "O NFDOS foi compilado com Sucesso!"


