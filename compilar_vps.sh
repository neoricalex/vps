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
			rm vagrant-libs/base.box


		fi
		echo "==> A box base foi gerada e está acessivel em src/vps/vagrant-libs/base.box."

	fi
	echo "==> A neoricalex/ubuntu (VPS_DEV) foi gerada."

	echo "==> O VPS_DEV baseado no neoricalex/ubuntu está agora pronto para ser executado."
	echo "==> Provisionando o neoricalex/ubuntu (VPS_DEV)..."
	cat vagrant-libs/ssh/neoricalex > ~/.vagrant.d/insecure_private_key
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
	echo "==> Reiniciando o neoricalex/ubuntu (VPS_DEV) para as configurações ficarem ativas..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload
}
entrar_vps(){

	echo "==> Entrando no neoricalex/ubuntu (VPS_DEV)..."
	VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash

cd /vagrant

make nfdos

cd .. 
EOF
}
if VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "not created" > /dev/null;
then
    provisionar_vps
	entrar_vps
elif VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status | grep "is running" > /dev/null;
then
	entrar_vps
else
    echo "[DEBUG] O VPS_DEV existe mas está com um status diferente..."
    VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant status 
    sleep 5
fi
