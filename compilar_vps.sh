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

	echo "==> Adicionar a box neoricalex/ubuntu ao Vagrant..."
	vagrant box add \
		--name neoricalex/ubuntu \
		--provider virtualbox \
		vagrant-libs/base.box

	echo "==> Enviar a box neoricalex/ubuntu para a Vagrant Cloud..."
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

echo "==> Certificar em como as permissões do KVM estão setadas..."
echo "==> [WORKAROUND]: Não sei porquê, mas se setarmos as permissões nos requerimentos, elas de alguma forma, não ficam \"ativas\""
sudo chown root:kvm /dev/kvm
sudo chmod -R 660 /dev/kvm
sudo udevadm control --reload-rules
sudo systemctl restart libvirtd

if vagrant plugin list | grep "vagrant-libvirt" > /dev/null;
then

	echo "==> Instalar plugins do Vagrant"
	echo "==> [WORKAROUND]: Não sei porquê, mas se colocarmos a instalação dos plugins nos requerimentos, eles de alguma forma, não ficam \"ativos\""
	vagrant plugin install vagrant-libvirt
	#vagrant plugin install vagrant-disksize # Só funciona no Virtualbox
	#vagrant plugin install vagrant-mutate
	#vagrant plugin install vagrant-bindfs
fi

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
	#VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up --provision
	entrar_vps

else

    echo "==> [DEBUG] O VPS_DEV existe mas está com um status desconhecido."
    VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status 
	sleep 5

fi
