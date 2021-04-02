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
			echo "==> Empacotando o VPS_BASE..."
			vagrant package --base VPS_BASE --output vagrant-libs/base.box

			echo "==> Excluir o VPS_BASE pois não é mais necessário..."
			VAGRANT_VAGRANTFILE=Vagrantfile.VPS_BASE vagrant destroy -f
			#echo "==> Excluir a box ubuntu/focal64 pois não é mais necessária..."
			#vagrant box remove ubuntu/focal64 --provider virtualbox

		fi
		echo "==> O VPS_BASE foi gerado e empacotado."

	fi
	echo "==> A box do VPS_DEV já foi gerada."

	if ! vagrant box list | grep "neoricalex/ubuntu" > /dev/null;
	then
		echo "==> Adicionar a box neoricalex/ubuntu ao Vagrant..."
		vagrant box add \
			--name neoricalex/ubuntu \
			--provider virtualbox \
			vagrant-libs/base.box
	fi

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

echo "Compilando o NFDOS..."
make nfdos
cd ..
EOF
}

if VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "not created" > /dev/null;
then

    criar_vps
	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "is running" > /dev/null;
then

	entrar_vps

elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "aborted" > /dev/null;
then

	vboxmanage startvm VPS_DEV --type headless
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	entrar_vps

else

    echo "==> [DEBUG] O VPS_DEV existe mas está com um status desconhecido."
    VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status 
	sleep 5

fi

usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
if [ "$usuario" == "neo@desktop" ]; then

    vagrant cloud auth login
	vagrant box list
	pwd

    #cd src/vps
    #vagrant box repackage nfdos/desktop/vagrant/libvirt/NFDOS-0.4.5.box libvirt 0
    #rm src/vps/nfdos/desktop/vagrant/libvirt/NFDOS-0.4.5.box
    #mv package.box nfdos/desktop/vagrant/libvirt/NFDOS-0.4.5.box
    #cd ../..

    #vagrant cloud publish \
    #    --box-version 0.4.5 \
    #    --release \
    #    --short-description "Ubuntu from scratch coded with Portuguese Language" \
    #    --version-description "Primeira versão box" \
    #    neoricalex/nfdos 0.4.5 libvirt \
    #    src/vps/nfdos/desktop/vagrant/libvirt/NFDOS-0.4.5.box # --force --debug

    vagrant cloud auth logout
fi
