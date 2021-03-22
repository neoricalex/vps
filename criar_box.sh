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

    if ! command -v vboxmanage &> /dev/null
    then
        instalar_virtualbox
    else
        sudo apt purge virtualbox* -y
        apt autoremove -y
        sleep 1
        instalar_virtualbox
    fi

    if ! command -v vagrant &> /dev/null
    then
        instalar_vagrant
    else
        sudo apt purge vagrant* -y
        apt autoremove -y
        sleep 1
        instalar_vagrant
    fi

    echo "==> Removendo pacotes do Ubuntu desnecessários"
    apt autoremove -y

    touch .requerimentos.box
fi

echo "==> Iniciando a box..."
iniciar_box(){
    VAGRANT_VAGRANTFILE=Vagrantfile_Virtualbox vagrant up
    vagrant ssh <<EOF
#!/bin/bash

cd /vagrant
make iso
cd ..

EOF
}

if vagrant status | grep "not created" > /dev/null; then
    iniciar_box
elif vagrant status | grep "is running" > /dev/null; then
    echo "[DEBUG] O VPS_DEV existe e está ligado. Destruir e começar de novo?"
    vagrant destroy
    iniciar_box
elif vagrant status | grep "poweroff" > /dev/null; then
    echo "[DEBUG] O VPS_DEV existe mas está desligado. Destruir e começar de novo..."
    vagrant destroy -f
    iniciar_box
else
    echo "[DEBUG] O VPS_DEV existe mas está com um status diferente..."
    vagrant status
    sleep 5
fi