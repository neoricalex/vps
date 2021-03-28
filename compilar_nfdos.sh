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
}

compilar_vps_remoto(){

	# VBoxManage list vms -l | grep -e ^Name: -e ^State | sed s/\ \ //g | cut -d: -f2-
	#sudo killall vagrant
	#sudo killall ruby
	#virsh vol-delete --pool default neoricalex-VAGRANTSLASH-nfdos_vagrant_box_image_0.img
	#virsh vol-delete --pool default NEORICALEX_NFDOS-vdb.qcow2
	#virsh vol-delete --pool default NEORICALEX_NFDOS.img
	#virsh vol-list default
	#vagrant destroy -f
	
    vagrant up --provider=libvirt
    vagrant ssh <<EOF
#!/bin/bash

sudo chown -R neo:neo /var/lib/neoricalex

cd /var/lib/neoricalex
git pull

#echo "$USER@$HOSTNAME"
#virsh vol-list default
#virsh vol-delete --pool default generic-VAGRANTSLASH-ubuntu2004_vagrant_box_image_3.2.12.img
#virsh vol-delete --pool default NEORICALEX_NFDOS_VPS-vdb.qcow2
#virsh vol-delete --pool default NEORICALEX_NFDOS_VPS.img

vagrant box remove ubuntu/focal64 --all
vagrant box list

#echo "==> Instalar Wireguard..."
#apt install wireguard -y
#cp src/vps/vagrant-libs/ssh/digital-ocean/wireguard/cliente/wg0.conf /etc/wireguard/wg0.conf
#wg-quick up wg0

#ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p'

# TODO: Trellis/Bedrock/Wordpress: https://www.youtube.com/watch?v=-pOKTtAfJ8M&ab_channel=WPCasts
# TODO Ainsible Docker Swarm: https://imasters.com.br/devsecops/cluster-de-docker-swarm-com-ansible
# TODO: REF: https://unix.stackexchange.com/questions/172179/gnome-shell-running-shell-script-after-session-starts

# sudo sed -i -e "\\#PasswordAuthentication yes# s#PasswordAuthentication yes#PasswordAuthentication no#g" /etc/ssh/sshd_config
# sudo systemctl restart sshd.service
# echo "finished"

echo ""
echo "O NFDOS foi compilado com Sucesso!"

EOF
}

compilar_iso
compilar_vps_remoto
