#!/bin/bash

source .variaveis_ambiente_vps_dev

compilar_iso(){

	echo "Iniciando a compilação da imagem ISO do NFDOS $NFDOS_VERSAO ..."

	echo "Checkando se a $NFDOS_HOME existe"
	if [ ! -d "$NFDOS_HOME" ]; then
		mkdir -p $NFDOS_HOME
		mkdir -p $NFDOS_HOME/core
		mkdir -p $NFDOS_HOME/desktop
	fi

	echo "Checkando se a $NFDOS_ROOT/nfdos.iso existe"
	if [ ! -f "$NFDOS_ROOT/nfdos.iso" ]; then
		echo "A $NFDOS_ROOT/nfdos.iso não existe. Criando ela..."
		bash "$NFDOS_ROOT/criar_iso.sh"
	else
		echo "A $NFDOS_ROOT/nfdos.iso existe"
	fi

	if [ "$VERSAO_BOX_VAGRANT" == "virtualbox" ]; 
	then
		echo "Checkando se a $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box existe..."
		if [ ! -f "$NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box" ]; 
		then
			echo "A $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box não existe. Criando ela..."

			echo "Checkando o SHA256 da imagem ISO..."
			checkar_sha256=$(sha256sum $NFDOS_ROOT/nfdos.iso | awk '{ print $1 }')
			jq ".variables.iso_checksum = \"$checkar_sha256\"" $NFDOS_HOME/desktop/virtualbox.json | sponge $NFDOS_HOME/desktop/virtualbox.json

			cd $NFDOS_HOME/desktop
			packer build virtualbox.json #VBoxManage setextradata VM-name "VBoxInternal/TM/TSCTiedToExecution" 1
			cd $NEORICALEX_HOME
		fi
		echo "A $NFDOS_HOME/desktop/vagrant/virtualbox/NFDOS-$NFDOS_VERSAO.box existe."

	elif [ "$VERSAO_BOX_VAGRANT" == "libvirt" ];
	then
		echo "Checkando se a $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box existe..."
		if [ ! -f "$NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box" ]; then

			echo "A $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box não existe. Criando ela..."

			echo "Checkando o SHA256 da imagem ISO..."
			checkar_sha256=$(sha256sum $NFDOS_ROOT/nfdos.iso | awk '{ print $1 }')
			jq ".variables.iso_checksum = \"$checkar_sha256\"" $NFDOS_HOME/desktop/libvirt.json | sponge $NFDOS_HOME/desktop/libvirt.json

			cd $NFDOS_HOME/desktop
			PACKER_LOG=1 packer build libvirt.json # PACKER_LOG=1
			cd $NEORICALEX_HOME
		fi
		echo "A $NFDOS_HOME/desktop/vagrant/libvirt/NFDOS-$NFDOS_VERSAO.box já existe."
	else
		echo "A versão $VERSAO_BOX_VAGRANT do vagrant não é suportada."
	fi

	#echo "==> [DEBUG] vagrant global-status --prune"
	#vagrant global-status --prune
	#vagrant destroy -f --name NFDOS

	#echo "==> [DEBUG] vboxmanage list vms"
	#vboxmanage list vms
	#vboxmanage controlvm vps_VPS_1616955616906_88956 poweroff
	#vboxmanage unregistervm vps_VPS_1616955616906_88956 --delete
	# VBoxManage list vms -l | grep -e ^Name: -e ^State | sed s/\ \ //g | cut -d: -f2-

	#echo "==> [DEBUG] vagrant box list"
	#vagrant box list
	#vagrant box remove neoricalex/nfdos
	#vagrant box remove ubuntu/focal64 --all

	#echo "==> [DEBUG] virsh vol-list default"
	#virsh vol-list default
	#virsh vol-delete --pool default neoricalex-VAGRANTSLASH-nfdos_vagrant_box_image_0.img
	#virsh vol-delete --pool default NEORICALEX_NFDOS-vdb.qcow2
	#virsh vol-delete --pool default NEORICALEX_NFDOS.img
	#virsh vol-delete --pool default generic-VAGRANTSLASH-ubuntu2004_vagrant_box_image_3.2.12.img
	#virsh vol-delete --pool default NEORICALEX_NFDOS_VPS-vdb.qcow2
	#virsh vol-delete --pool default NEORICALEX_NFDOS_VPS.img

	#sudo killall vagrant
	#sudo killall ruby
}

resetar_vps(){

	echo "==> [DEBUG] Matando e destruindo processos vagrant e ruby..."
	sudo killall vagrant
	sudo killall ruby
	vagrant destroy -f

	echo "==> [DEBUG] Provisionando o NFDOS..."
    vagrant up --provider=libvirt --provision

	echo "==> [DEBUG] Entrando no NFDOS..."
    vagrant ssh <<RESETAR_VPS
#!/bin/bash

cd /var/lib/neoricalex/src/vps/nfdos/desktop/app
bash iniciar.sh

RESETAR_VPS
}

entrar_vps(){
	echo "==> Entrando no NFDOS..."
    vagrant ssh <<ENTRAR_VPS
#!/bin/bash

cd /var/lib/neoricalex/src/vps/nfdos/desktop/app
bash iniciar.sh

ENTRAR_VPS
}

compilar_iso

if vagrant status | grep "not created" > /dev/null;
then

    vagrant up --provider=libvirt
	vagrant reload --provider=libvirt
	entrar_vps

elif vagrant status | grep "is running" > /dev/null;
then

	#entrar_vps
	vagrant destroy -f 

else

    echo "==> [DEBUG] O NFDOS existe mas está com um status desconhecido:"
    vagrant status 
	sleep 5
    echo "==> [DEBUG] Resetando..."
	resetar_vps

fi
