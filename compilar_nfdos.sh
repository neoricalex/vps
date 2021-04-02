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

resetar_vps(){

	echo "==> [DEBUG] Matando e destruindo processos vagrant e ruby..."
	sudo killall vagrant
	sudo killall ruby
	vagrant destroy -f

	echo "==> [DEBUG] Provisionando o NFDOS..."
    vagrant up --provider=$VERSAO_BOX_VAGRANT --provision

	echo "==> [DEBUG] Entrando no NFDOS..."
    vagrant ssh <<RESETAR_VPS
#!/bin/bash

echo "Parece Bom!"

RESETAR_VPS
}
limpeza_geral_vps(){
	echo "==> Entrando no NFDOS pela primeira vez, e efetuar uma limpeza geral..."
    vagrant ssh <<LIMPEZA_VPS
#!/bin/bash

sudo apt purge -y adwaita-icon-theme gedit-common gir1.2-gdm-1.0 \
	gir1.2-gnomebluetooth-1.0 gir1.2-gnomedesktop-3.0 gir1.2-goa-1.0 \
	gnome-accessibility-themes gnome-bluetooth gnome-calculator gnome-calendar \
	gnome-characters gnome-control-center gnome-control-center-data \
	gnome-control-center-faces gnome-desktop3-data \
	gnome-font-viewer gnome-getting-started-docs gnome-getting-started-docs-ru \
	gnome-initial-setup gnome-keyring gnome-keyring-pkcs11 gnome-logs \
	gnome-mahjongg gnome-menus gnome-mines gnome-online-accounts \
	gnome-power-manager gnome-screenshot gnome-session-bin gnome-session-canberra \
	gnome-session-common gnome-settings-daemon gnome-settings-daemon-common \
	gnome-shell gnome-shell-common gnome-shell-extension-appindicator \
	gnome-shell-extension-desktop-icons gnome-shell-extension-ubuntu-dock \
	gnome-startup-applications gnome-sudoku gnome-system-monitor gnome-terminal \
	gnome-terminal-data gnome-themes-extra gnome-themes-extra-data gnome-todo \
	gnome-todo-common gnome-user-docs gnome-user-docs-ru gnome-video-effects \
	language-pack-gnome* language-selector-gnome libgail18 libgail18 \
	libgail-common libgail-common libgnome-autoar-0-0 libgnome-bluetooth13 \
	libgnome-desktop-3-19 libgnome-games-support-1-3 libgnome-games-support-common \
	libgnomekbd8 libgnomekbd-common libgnome-menu-3-0 libgnome-todo libgoa-1.0-0b \
	libgoa-1.0-common libpam-gnome-keyring libsoup-gnome2.4-1 libsoup-gnome2.4-1 \
	nautilus-extension-gnome-terminal pinentry-gnome3 yaru-theme-gnome-shell

sudo apt autopurge -y

sudo apt purge -y adwaita-icon-theme geogebra-gnome gir1.2-gtd-1.0 \
	gnome-accessibility-profiles gnome-applets-data gnome-audio gnome-backgrounds \
	gnome-cards-data gnome-common gnome-desktop-testing gnome-dvb-daemon \
	gnome-exe-thumbnailer gnome-extra-icons gnome-flashback-common \
	gnome-humility-icon-theme gnome-hwp-support gnome-icon-theme \
	gnome-icon-theme* gnome-mime-data gnome-nds-thumbnailer \
	gnome-packagekit-data gnome-panel-control gnome-panel-data \
	gnome-pkg-tools gnome-recipes-data gnome-remote-desktop gnome-settings-daemon-dev \
	gnome-shell-pomodoro-data gnome-software-common gnome-software-doc \
	gnome-theme-gilouche gnome-video-effects-extra gnome-video-effects-frei0r \
	guile-gnome2-dev guile-gnome2-glib libgnome-autoar-doc libgnomecanvas2-common \
	libgnomecanvas2-doc libgnomecanvasmm-2.6-doc libgnome-panel-doc libgnome-todo-dev \
	libopenrawgnome7:amd64 libopenrawgnome-dev libreoffice-gnome libxine2-gnome:amd64 \
	nautilus-sendto pidgin-gnome-keyring plymouth-theme-ubuntu-gnome-logo \
	plymouth-theme-ubuntu-gnome-text ubuntu-gnome-wallpapers \
	ubuntu-gnome-wallpapers-trusty ubuntu-gnome-wallpapers-utopic \
	ubuntu-gnome-wallpapers-xenial ubuntu-gnome-wallpapers-yakkety

sudo apt autopurge -y

sudo apt-get remove --auto-remove ubuntu-gnome-desktop -y
sudo apt-get purge ubuntu-gnome-desktop -y
sudo apt-get purge --auto-remove ubuntu-gnome-desktop -y

sudo apt-get autoremove -y
sudo apt-get autoclean -y
sudo apt-get autopurge -y

echo "Nos certificar em como não apagamos coisas \"demais\"..."
sudo apt install -y linux-generic ubuntu-minimal

echo "==> E vamos nos certificar em como não existem updates para fazer..."
sudo apt update && sudo apt upgrade -y

echo "==> E vamos nos certificar em como não existem entradas antigas do kernel na Grub..."
# REF: https://askubuntu.com/questions/176322/removing-old-kernel-entries-in-grub
sudo apt-get purge $( dpkg --list | grep -P -o "linux-image-\d\S+" | grep -v $(uname -r | grep -P -o ".+\d") ) -y
LIMPEZA_VPS
}

entrar_vps(){
	echo "==> Entrando no NFDOS..."
    vagrant ssh <<ENTRAR_VPS
#!/bin/bash

echo ""
echo "O NFDOS foi compilado com Sucesso!"
# TODO: https://www.howtogeek.com/104708/how-to-customize-ubuntus-message-of-the-day/
ENTRAR_VPS
}

echo -e "==> [WORKAROUND]: Certificar em como as permissões do KVM estão setadas. \n Não sei porquê, mas se setarmos as permissões nos requerimentos, elas de alguma forma, não ficam \"ativas\" \n"
sudo chown root:kvm /dev/kvm
sudo chmod -R 660 /dev/kvm
sudo udevadm control --reload-rules
sudo systemctl restart libvirtd

if vagrant status | grep "not created" > /dev/null;
then

	compilar_iso

	echo "==> Adicionar a box neoricalex/nfdos ao Vagrant..."
	vagrant box add \
		--name neoricalex/nfdos \
		--provider $VERSAO_BOX_VAGRANT \
		$NFDOS_HOME/desktop/vagrant/$VERSAO_BOX_VAGRANT/NFDOS-$NFDOS_VERSAO.box

	echo "==> Provisionando o NFDOS..."
    vagrant up --provider $VERSAO_BOX_VAGRANT
	limpeza_geral_vps

	entrar_vps

elif vagrant status | grep "is running" > /dev/null;
then

	entrar_vps

else

    echo "==> [DEBUG] O NFDOS existe mas está com um status desconhecido:"
	vagrant status 
	sleep 5

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
