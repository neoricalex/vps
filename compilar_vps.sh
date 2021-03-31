#!/bin/bash

criar_vps(){

	echo "==> Checkar se a box do VPS_DEV foi gerada..."
	vps_dev=$(vagrant box list | grep "neoricalex/ubuntu" > /dev/null)
	if [ $? == "1" ];
	then
		echo "==> Checkar se a box base com o Ubuntu - VPS_BASE - foi gerada..."
		if [ ! -f "vagrant-libs/base.box" ];
		then
			echo "==> Provisionando o VPS_BASE..."
			#VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant destroy -f
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant up
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant ssh<<EOF
#!/bin/bash

echo "Atualizando os pacotes do VPS_BASE..."
sudo apt update && sudo apt upgrade -y
echo "O VPS_BASE foi provisionado com sucesso!"
echo "Continuando..."
EOF

			echo "==> Reiniciando o VPS_BASE..."
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant reload
			echo "==> Empacotando o VPS_BASE como VPS_DEV..."
			vagrant package --base VPS_BASE --output vagrant-libs/base.box

			usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
			if [ "$usuario" == "neo@desktop" ]; 
			then
				vagrant cloud auth login
				vagrant cloud publish \
					--box-version 0.0.1 \
					--release \
					--short-description "Um VPS baseado no ubuntu/focal64 para desenvolvimento do projeto NEORICALEX e NFDOS" \
					--version-description "Versão inicial" \
					neoricalex/ubuntu 0.0.1 virtualbox \
					vagrant-libs/base.box # --force --debug
				vagrant cloud auth logout
			else
				echo "[DEBUG] Para enviar a box base para a Vagrant Cloud tem que ter as credenciais. Continuando..."
			fi

			echo "==> Excluir o VPS_BASE pois não é mais necessário..."
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant destroy -f
			#echo "==> Excluir a box ubuntu/focal64 pois não é mais necessária..."
			#vagrant box remove ubuntu/focal64 --provider virtualbox

			#echo "==> Excluir também a vagrant-libs/base.box para liberarmos espaço em disco..."
			#rm vagrant-libs/base.box


		fi
		echo "==> O VPS_BASE foi gerado e empacotado como VPS_DEV."

	fi
	echo "==> O VPS_DEV foi gerado."

	echo "==> O VPS_DEV baseado no neoricalex/ubuntu está agora pronto para ser executado."
	echo "==> Provisionando o VPS_DEV..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	echo "==> Reiniciando o VPS_DEV para as configurações ficarem ativas..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload
}

entrar_vps(){
	echo "==> Entrando no VPS_DEV..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash

cd /neoricalex
make nfdos
cd ..
EOF
}

if VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "not created" > /dev/null;
then

    criar_vps
	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "poweroff" > /dev/null;
then

	echo "==> [DEBUG] O VPS_DEV existe mas está com um status de desligado. Ligando o VPS_DEV..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "is running" > /dev/null;
then

	entrar_vps

else

    echo "==> [DEBUG] O VPS_DEV existe mas está com um status desconhecido."
    VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status 
	sleep 5

fi
