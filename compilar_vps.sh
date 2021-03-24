#!/bin/bash

instalar_virtualbox(){
    echo "==> Instalar o VirtualBox"
    sudo apt install -y virtualbox
    sudo apt install -y virtualbox-guest-dkms virtualbox-guest-x11
    sudo apt install -y virtualbox-guest-additions-iso

    echo "==> Instalar o Extension Pack do VirtualBox"
    wget https://download.virtualbox.org/virtualbox/6.1.18/Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack
    sudo vboxmanage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack --accept-license=33d7284dc4a0ece381196fda3cfe2ed0e1e8e7ed7f27b9a9ebc4ee22e24bd23c
    rm Oracle_VM_VirtualBox_Extension_Pack-6.1.18.vbox-extpack 
}
instalar_vagrant(){
    echo "==> Download Vagrant & Instalar"
    wget -nv https://releases.hashicorp.com/vagrant/2.2.9/vagrant_2.2.9_x86_64.deb
    sudo dpkg -i vagrant_2.2.9_x86_64.deb
    rm vagrant_2.2.9_x86_64.deb

    echo "==> Instalar plugins do Vagrant"
    vagrant plugin install vagrant-libvirt
    vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
    vagrant plugin install vagrant-mutate
}
instalar_requerimentos_para_rodar_vps(){
	echo "==> Instalar os requerimentos para rodar o VPS_DEV..."
	if [ ! -f ".requerimentos.box" ]; 
	then
		echo "==> Atualizar os repositórios..."
		sudo apt update

		echo "==> Instalar o Linux/Ubuntu base..."
		sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

		echo "==> Instalar libvrt & KVM" 
		# REF: https://github.com/alvistack/ansible-role-virtualbox/blob/master/.travis.yml
		sudo apt install -y bridge-utils dnsmasq-base ebtables libvirt-daemon-system libvirt-clients \
			libvirt-dev qemu-kvm qemu-utils qemu-user-static ruby-dev \
			ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev

		if ! command -v vboxmanage &> /dev/null;
		then
			instalar_virtualbox
		else
			sudo apt purge virtualbox* -y
			sudo mv /usr/lib/virtualbox /usr/lib/virtualbox.old
			sudo apt autoremove -y
			sleep 1
			instalar_virtualbox
		fi

		if ! command -v vagrant &> /dev/null;
		then
			instalar_vagrant
		else
			sudo apt purge vagrant* -y
			sudo apt autoremove -y
			sleep 1
			instalar_vagrant
		fi

		echo "==> Removendo pacotes do Ubuntu desnecessários"
		sudo apt autoremove -y
		touch .requerimentos.box

		#echo "==> Checkando se a box neoricalex/ubuntu existe localmente no $HOSTNAME ..."
		#if ! vagrant box list | grep "neoricalex/ubuntu" > /dev/null; 
		#then
		#	echo "==> Checkando se o download da box já foi feito..."
		#	if [ ! -f "vagrant-libs/virtualbox.box" ]; 
		#	then
		#		echo "Iniciando o download..."
		#		cd vagrant-libs
		#		wget https://vagrantcloud.com/ubuntu/boxes/focal64/versions/20210320.0.0/providers/virtualbox.box \
		#			-q --show-progress \
		#			--progress=bar:force:noscroll
		#		cd ..
		#	fi
		#	echo "==> O download da box já foi feito."

			#vagrant box add --provider "virtualbox" \
			#	--box-version "0.0.1" \
			#	--name "neoricalex/ubuntu" \
			#	vagrant-libs/virtualbox.box

		#fi
		#echo "==> A box existe no $HOSTNAME"

	fi
	echo "==> Os requerimentos para rodar o VPS_DEV foram instalados."
}
provisionar_vps(){

	usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
	if [ "$usuario" == "neo@desktop" ]; 
	then
		vps_dev=$(vagrant box list | grep "neoricalex/ubuntu" > /dev/null)
		if [ $? == "1" ];
		then
			vagrant cloud auth login
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant package --base neoricalex/ubuntu --output vagrant-libs/vps_dev.box
			exit
			#vagrant cloud publish \
			#--box-version $NFDOS_VERSAO \
			#--release \
			#--short-description "An Ubuntu-based box for developing an Ubuntu-based GNU/Linux distribution from scratch, coded in Portuguese Language" \
			#--version-description "Versão inicial" \
			#neoricalex/ubuntu $NFDOS_VERSAO virtualbox \
			#nfdos/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box # --force --debug
			#vagrant cloud auth logout
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash
sudo apt-get clean -y 
sudo dd if=/dev/zero of=/EMPTY bs=1M
EOF

		fi
	fi
}

instalar_requerimentos_para_rodar_vps
provisionar_vps
