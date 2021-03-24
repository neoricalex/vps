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
	if [ ! -f ".requerimentos_host.box" ]; 
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
		touch .requerimentos_host.box

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

	echo "==> Checkar se a neoricalex/ubuntu (VPS_DEV) foi gerada..."
	vps_dev=$(vagrant box list | grep "neoricalex/ubuntu" > /dev/null)
	if [ $? == "1" ];
	then
		echo "==> Checkar se a vagrant-libs/vps_dev.box foi gerada..."
		if [ ! -f "vagrant-libs/vps_dev.box" ];
		then
			echo "==> Provisionando a vagrant-libs/vps_dev.box..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant up
			echo "==> Reiniciando a vagrant-libs/vps_dev.box para as configurações ficarem ativas..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant reload
			echo "==> Entrando na vagrant-libs/vps_dev.box..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant ssh<<EOF
#!/bin/bash

echo "Inserindo a Chave SSH Pública..."
echo "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA6NF8iallvQVp22WDkTkyrtvp9eWW6A8YVr+kz4TjGYe7gHzIw+niNltGEFHzD8+v1I2YJ6oXevct1YeS0o9HZyN1Q9qgCgzUFtdOKLv6IedplqoPkcmF0aYet2PkEDo3MlTBckFXPITAMzF8dJSIFo9D8HfdOV0IAdx4O7PtixWKn5y2hMNG0zQPyUecp4pzC6kivAIhyfHilFR61RGL+GPXQ2MWZWFYbAGjyiYJnAmCP3NOTd0jMZEnDkbUvxhMmBYSdETk1rRgm+R4LOzFUGaHqHDLKLX+FIPKcF96hrucXzcWyLbIbEgE98OHlnVYCzRdK8jlqm8tehUc9c9WhQ== vagrant insecure public key" > ~/.ssh/authorized_keys
find ~/.ssh -type d -exec chmod 0700 {} \;
find ~/.ssh -type f -exec chmod 0600 {} \;

echo "Limpando..."
sudo apt-get clean -y 
EOF
			echo "==> Empacotando a vagrant-libs/vps_dev.box..."
			vagrant package --base VPS_DEV --output vagrant-libs/vps_dev.box

			usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
			if [ "$usuario" == "neo@desktop" ]; 
			then
				vagrant cloud auth login
				vagrant cloud publish \
					--box-version 0.0.2 \
					--release \
					--short-description "Um VPS baseado no ubuntu/focal64 para desenvolvimento do projeto NEORICALEX e NFDOS" \
					--version-description "Inserir a Chave SSH Pública" \
					neoricalex/ubuntu 0.0.2 virtualbox \
					vagrant-libs/vps_dev.box # --force --debug
				vagrant cloud auth logout
			else
				echo "[DEBUG] Para enviar a vagrant-libs/vps_dev.box para a Vagrant Cloud tem que ter as credenciais. Continuando..."
			fi

			echo "==> Excluir o VPS_DEV baseado no ubuntu/focal64 pois não é mais necessário..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant destroy -f
			vagrant box remove ubuntu/focal64 --provider virtualbox


		fi
		echo "==> A vagrant-libs/vps_dev.box foi gerada."
		echo "==> O VPS_DEV baseado no neoricalex/ubuntu está pronto para ser executado."
		echo "==> Provisionando o neoricalex/ubuntu (VPS_DEV)..."
		VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
		echo "==> Reiniciando o neoricalex/ubuntu (VPS_DEV) para as configurações ficarem ativas..."
		VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload

	fi
	echo "==> A neoricalex/ubuntu (VPS_DEV) foi gerada."
}

instalar_requerimentos_para_rodar_vps
provisionar_vps

echo "==> Entrando no neoricalex/ubuntu (VPS_DEV)..."
VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash

cd /vagrant
make iso

if ! command -v vagrant &> /dev/null
then
	echo "Download Vagrant & Instalar"
	wget -nv https://releases.hashicorp.com/vagrant/2.2.9/vagrant_2.2.9_x86_64.deb
	sudo dpkg -i vagrant_2.2.9_x86_64.deb
	rm vagrant_2.2.9_x86_64.deb

	echo "Instalar plugins do Vagrant"
	vagrant plugin install vagrant-libvirt
	
fi

vagrant up

cd .. 
EOF

echo "==> A compilação do VPS_DEV foi concluída com sucesso!"
