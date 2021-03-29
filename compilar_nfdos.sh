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

compilar_vps_remoto(){

	echo "==> Provisionando o NFDOS..."
	sudo killall vagrant
	sudo killall ruby
	vagrant destroy -f
	#exit
    vagrant up --provider=libvirt --provision
	echo "==> Entrando no NFDOS..."
    vagrant ssh <<EOF
#!/bin/bash

cd /var/lib/neoricalex/src/vps/nfdos/desktop/app
bash iniciar.sh

EOF
}

compilar_iso
compilar_vps_remoto

