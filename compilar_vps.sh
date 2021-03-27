#!/bin/bash

provisionar_vps(){

	echo "==> Checkar se a neoricalex/ubuntu (VPS_DEV) foi gerada..."
	vps_dev=$(vagrant box list | grep "neoricalex/ubuntu" > /dev/null)
	if [ $? == "1" ];
	then
		echo "==> Checkar se a box base foi gerada..."
		if [ ! -f "vagrant-libs/base.box" ];
		then
			echo "==> Provisionando a box base..."
			#VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant destroy -f
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant up
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant ssh<<EOF
#!/bin/bash
echo "A Box base foi provisionada com sucesso!"
echo "Continuando..."
EOF
			echo "==> Reiniciando a box base..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant reload
			echo "==> Empacotando a box base..."
			vagrant package --base VPS_DEV --output vagrant-libs/base.box

			usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
			if [ "$usuario" == "neo@desktop" ]; 
			then
				vagrant cloud auth login
				vagrant cloud publish \
					--box-version 0.0.4 \
					--release \
					--short-description "Um VPS baseado no ubuntu/focal64 para desenvolvimento do projeto NEORICALEX e NFDOS" \
					--version-description "Inserir a Chave SSH" \
					neoricalex/ubuntu 0.0.4 virtualbox \
					vagrant-libs/base.box # --force --debug
				vagrant cloud auth logout
			else
				echo "[DEBUG] Para enviar a box base para a Vagrant Cloud tem que ter as credenciais. Continuando..."
			fi

			echo "==> Excluir a box ubuntu/focal64 pois não é mais necessária..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant destroy -f
			vagrant box remove ubuntu/focal64 --provider virtualbox

			echo "==> Excluir também a vagrant-libs/base.box para liberarmos espaço em disco..."
			rm vagrant-libs/base.box


		fi
		echo "==> A box base foi gerada e está acessivel em src/vps/vagrant-libs/base.box."

	fi
	echo "==> A neoricalex/ubuntu (VPS_DEV) foi gerada."

	echo "==> O VPS_DEV baseado no neoricalex/ubuntu está agora pronto para ser executado."
	echo "==> Provisionando o neoricalex/ubuntu (VPS_DEV)..."
	#cat vagrant-libs/ssh/neoricalex > ~/.vagrant.d/insecure_private_key
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	echo "==> Reiniciando o neoricalex/ubuntu (VPS_DEV) para as configurações ficarem ativas..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload
}

entrar_vps(){

	echo "==> Entrando no VPS_DEV..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash

cd /neoricalex

echo "Configurando o Wireguard..."
if ! command -v wg &> /dev/null;
then
	sudo apt install -y wireguard
	if [ ! -d "docker/wireguard/digital-ocean" ]; 
	then
		cp docker/wireguard/digital-ocean/cliente/wg0.conf /etc/wireguard/wg0.conf
		sudo sysctl -w net ipv4.ip_forward=1
		sudo sysctl -w net ipv6.conf.all.forwarding=1
		sudo systemctl enable wg-quick@wg0
		sudo systemctl start wg-quick@wg0

		ip=$(ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p')
		if [ $ip = "192.168.100.2" ];
		then
			echo "Wireguard configurado com sucesso!"
		fi

	fi
else
	echo "# TODO"
fi

#virsh vol-delete --pool default neoricalex-VAGRANTSLASH-nfdos_vagrant_box_image_0.img
#virsh vol-delete --pool default NEORICALEX_NFDOS-vdb.qcow2
#virsh vol-delete --pool default NEORICALEX_NFDOS.img
#virsh vol-list default
#vagrant destroy -f

#make nfdos

cd .. 
EOF
}

if VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "not created" > /dev/null;
then

    provisionar_vps
	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "poweroff" > /dev/null;
then

	echo "==> Ligando o VPS_DEV..."
	#cat vagrant-libs/ssh/neoricalex > ~/.vagrant.d/insecure_private_key
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "paused" > /dev/null;
then

	echo "[DEBUG] O VPS_DEV existe mas está com o status de pausado. Ligando ele de volta..."
	vboxmanage controlvm VPS_DEV poweroff
	#cat vagrant-libs/ssh/neoricalex > ~/.vagrant.d/insecure_private_key
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up --provision
	entrar_vps


elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "is running" > /dev/null;
then

	entrar_vps

else

    echo "[DEBUG] O VPS_DEV existe mas está com um status desconhecido."
    VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status 
	sleep 5

	exit
	# TODO: Menu com opções
	title="Select example"
	prompt="Pick an option:"
	options=("A" "B" "C")

	echo "$title"
	PS3="$prompt "
	select opt in "${options[@]}" "Quit"; do 
		case "$REPLY" in
		1) echo "You picked $opt which is option 1";;
		2) echo "You picked $opt which is option 2";;
		3) echo "You picked $opt which is option 3";;
		$((${#options[@]}+1))) echo "Goodbye!"; break;;
		*) echo "Invalid option. Try another one.";continue;;
		esac
	done

	while opt=$(zenity --title="$title" --text="$prompt" --list \
					--column="Options" "${options[@]}")
	do
		case "$opt" in
		"${options[0]}") zenity --info --text="You picked $opt, option 1";;
		"${options[1]}") zenity --info --text="You picked $opt, option 2";;
		"${options[2]}") zenity --info --text="You picked $opt, option 3";;
		*) zenity --error --text="Invalid option. Try another one.";;
		esac
	done

fi
