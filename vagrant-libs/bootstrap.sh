#!/usr/bin/env bash
set -eux

echo "==> Atualizar os repositórios..."
sudo apt-get update
# sudo apt-get -y upgrade
# sudo apt-get -y dist-upgrade

# Remover entradas antigas do kernel na Grub
# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
sudo apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y

echo "==> Instalar o Linux/Ubuntu base..."
sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y


# Install Packages
sudo apt-get install -y build-essential checkinstall libreadline-gplv2-dev \
    libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev \
    libbz2-dev libffi-dev python3-pip unzip lsb-release software-properties-common \
    curl wget git rsync # python-dev python3-venv

echo "==> Instalar o VirtualBox"
#sudo apt install -y virtualbox
sudo deb [arch=amd64] https://download.virtualbox.org/virtualbox/debian focal contrib
wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
sudo apt-get update
sudo apt-get install virtualbox-6.1 -y
sudo apt install -y virtualbox-guest-dkms virtualbox-guest-x11
sudo apt install -y virtualbox-guest-additions-iso

echo "==> Instalar o Extension Pack do VirtualBox"
wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack \
	-q --show-progress \
	--progress=bar:force:noscroll
sudo vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 

echo "==> Download Vagrant & Instalar"
wget -nv https://releases.hashicorp.com/vagrant/2.2.9/vagrant_2.2.9_x86_64.deb
sudo dpkg -i vagrant_2.2.9_x86_64.deb
rm vagrant_2.2.9_x86_64.deb

echo "==> Instalar plugins do Vagrant"
vagrant plugin install vagrant-libvirt
vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
vagrant plugin install vagrant-mutate

echo "==> Instalar libvrt & KVM" 
# REF: https://github.com/alvistack/ansible-role-virtualbox/blob/master/.travis.yml
sudo apt install -y bridge-utils dnsmasq-base ebtables libvirt-daemon-system libvirt-clients \
	libvirt-dev qemu-kvm qemu-utils qemu-user-static ruby-dev \
	ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev

# Install Docker
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-cache policy docker-ce
sudo apt-get install -y docker-ce docker-compose
# Re-install docker-compose to side-step a bug
# docker build -t terraform-azure-vm . >> "free(): invalid pointer"
# https://github.com/docker/for-linux/issues/563
sudo apt-get remove -y golang-docker-credential-helpers
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
echo '{"experimental": true}' > /etc/docker/daemon.json
service docker restart

# Add neo user to docker group
sudo usermod -aG docker neo

echo "==> Removendo pacotes do Ubuntu desnecessários"
sudo apt autoremove -y

# TODO: Trellis/Bedrock/Wordpress: https://www.youtube.com/watch?v=-pOKTtAfJ8M&ab_channel=WPCasts
# TODO Ainsible Docker Swarm: https://imasters.com.br/devsecops/cluster-de-docker-swarm-com-ansible
# TODO: REF: https://unix.stackexchange.com/questions/172179/gnome-shell-running-shell-script-after-session-starts
