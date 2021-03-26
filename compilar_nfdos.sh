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

	if ! command -v vagrant &> /dev/null;
	then
		echo "==> Instalar Vagrant"
		wget -nv https://releases.hashicorp.com/vagrant/2.2.14/vagrant_2.2.14_x86_64.deb
		sudo dpkg -i vagrant_2.2.14_x86_64.deb
		rm vagrant_2.2.14_x86_64.deb

		echo "==> Instalar plugins do Vagrant"
		vagrant plugin install vagrant-libvirt
		vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
		vagrant plugin install vagrant-mutate
	fi

	# VBoxManage list vms -l | grep -e ^Name: -e ^State | sed s/\ \ //g | cut -d: -f2-
	#sudo killall vagrant
	#sudo killall ruby
	#vagrant destroy -f 
	
    vagrant up --provider=libvirt
    vagrant ssh <<EOF
#!/bin/bash

echo ""
echo "O NFDOS foi compilado com Sucesso!"

ls /var/lib/neoricalex

EOF
}

compilar_iso
compilar_vps_remoto

exit

if vagrant status | grep "not created" > /dev/null; then
    iniciar_vps
elif vagrant status | grep "is running" > /dev/null; then
    echo "[DEBUG] O VPS_DEV existe e está ligado. Destruir e começar de novo?"
    vagrant destroy
    iniciar_vps
elif vagrant status | grep "poweroff" > /dev/null; then
    echo "[DEBUG] O VPS_DEV existe mas está desligado. Destruir e começar de novo..."
    vagrant destroy -f
    iniciar_vps
else
    echo "[DEBUG] O VPS_DEV existe mas está com um status diferente..."
    vagrant status
    sleep 5
fi
