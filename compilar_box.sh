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

echo "==> Instalar os requerimentos da box..."
if [ ! -f ".requerimentos.box" ]; 
then
    echo "==> Atualizar os repositórios..."
    sudo apt update

    echo "==> Instalar Linux/Ubuntu base..."
    sudo apt-get install linux-generic linux-headers-`uname -r` ubuntu-minimal dkms -y

    echo "==> Instalar libvrt & KVM (REF: https://github.com/alvistack/ansible-role-virtualbox/blob/master/.travis.yml)"
    sudo apt install -y bridge-utils dnsmasq-base ebtables libvirt-daemon-system libvirt-clients \
        libvirt-dev qemu-kvm qemu-utils qemu-user-static ruby-dev \
        ruby-libvirt libxslt-dev libxml2-dev zlib1g-dev

    if ! command -v vagrant &> /dev/null;
    then
        instalar_vagrant
    else
        sudo apt purge vagrant* -y
        sudo apt autoremove -y
        sleep 1
        instalar_vagrant
    fi

    if ! command -v vboxmanage &> /dev/null;
    then
        instalar_virtualbox
    else
        sudo apt purge virtualbox* -y
        sudo rm -rf /usr/lib/virtualbox
        sudo apt autoremove -y
        sleep 1
        instalar_virtualbox
    fi

    echo "==> Removendo pacotes do Ubuntu desnecessários"
    sudo apt autoremove -y
    touch .requerimentos.box
fi

echo "==> Iniciando a box..."
checkar_box(){
	echo "==> Checkando se a box existe localmente..."
	if vagrant cloud search neoricalex/ubuntu | grep "No results found" > /dev/null; then
		echo "==> Checkando se o download da box já foi feito..."
		if [ ! -f "vagrant-libs/virtualbox.box" ]; 
		then
			wget https://vagrantcloud.com/ubuntu/boxes/focal64/versions/20210320.0.0/providers/virtualbox.box -o vagrant-libs/virtualbox.box
		fi
		echo "==> O download da box já foi feito!"
	fi
	echo "==> A box existe!"
}
provisionar_box(){
    VAGRANT_VAGRANTFILE=Vagrantfile_Virtualbox vagrant up
    VAGRANT_VAGRANTFILE=Vagrantfile_Virtualbox vagrant reload
}
iniciar_box(){
    VAGRANT_VAGRANTFILE=Vagrantfile_Virtualbox vagrant ssh <<EOF
#!/bin/bash

cd /vagrant
make iso
cd ..
EOF
}

if vagrant status | grep "not created" > /dev/null; then
	checkar_box
    provisionar_box
    iniciar_box
elif vagrant status | grep "is running" > /dev/null; then
    iniciar_box
else
    echo "[DEBUG] O VPS_DEV existe mas está com um status diferente..."
    vagrant status
    sleep 5
fi

usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
if [ "$usuario" == "neo@desktop" ]; then

	if vagrant cloud search neoricalex/ubuntu | grep "No results found" > /dev/null; then
		exit
		#vagrant cloud auth login
		vagrant cloud publish \
		--box-version $NFDOS_VERSAO \
		--release \
		--short-description "An Ubuntu-based box for developing an Ubuntu-based GNU/Linux distribution from scratch, coded in Portuguese Language" \
		--version-description "Versão inicial" \
		neoricalex/ubuntu $NFDOS_VERSAO virtualbox \
		nfdos/desktop/vagrant/NFDOS-$NFDOS_VERSAO.box # --force --debug
		#vagrant cloud auth logout
fi

