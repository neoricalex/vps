#!/bin/bash

instalar_requerimentos_para_rodar_vps(){
	echo "==> Instalar os requerimentos para rodar o VPS_DEV..."
	if [ ! -f ".requerimentos_host.box" ]; 
	then
		if ! command -v vboxmanage &> /dev/null;
		then
			instalar_virtualbox
		fi

		if ! command -v vagrant &> /dev/null;
		then
			instalar_vagrant
		fi

		echo "==> Removendo pacotes do Ubuntu desnecessários"
		sudo apt autoremove -y
		touch .requerimentos_host.box

	fi
	echo "==> Os requerimentos para rodar o VPS_DEV foram instalados."
}
provisionar_vps(){

	echo "==> Checkar se a neoricalex/ubuntu (VPS_DEV) foi gerada..."
	vps_dev=$(vagrant box list | grep "neoricalex/ubuntu" > /dev/null)
	if [ $? == "1" ];
	then
		echo "==> Checkar se a base.box foi gerada..."
		if [ ! -f "vagrant-libs/base.box" ];
		then
			echo "==> Provisionando a vagrant-libs/base.box..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant up
			echo "==> Reiniciando a vagrant-libs/base.box para as configurações ficarem ativas..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant reload
			echo "==> Entrando na vagrant-libs/base.box..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant ssh<<EOF
#!/bin/bash

echo "Inserindo a Chave SSH Pública..."
echo "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA6NF8iallvQVp22WDkTkyrtvp9eWW6A8YVr+kz4TjGYe7gHzIw+niNltGEFHzD8+v1I2YJ6oXevct1YeS0o9HZyN1Q9qgCgzUFtdOKLv6IedplqoPkcmF0aYet2PkEDo3MlTBckFXPITAMzF8dJSIFo9D8HfdOV0IAdx4O7PtixWKn5y2hMNG0zQPyUecp4pzC6kivAIhyfHilFR61RGL+GPXQ2MWZWFYbAGjyiYJnAmCP3NOTd0jMZEnDkbUvxhMmBYSdETk1rRgm+R4LOzFUGaHqHDLKLX+FIPKcF96hrucXzcWyLbIbEgE98OHlnVYCzRdK8jlqm8tehUc9c9WhQ== vagrant insecure public key" > ~/.ssh/authorized_keys
find ~/.ssh -type d -exec chmod 0700 {} \;
find ~/.ssh -type f -exec chmod 0600 {} \;

echo "Limpando..."
sudo apt-get clean -y 
EOF
			echo "==> Empacotando a vagrant-libs/base.box..."
			vagrant package --base VPS_DEV --output vagrant-libs/base.box

			usuario="$(whoami)@$(hostname | cut -d . -f 1-2)"
			if [ "$usuario" == "neo@desktop" ]; 
			then
				vagrant cloud auth login
				vagrant cloud publish \
					--box-version 0.0.3 \
					--release \
					--short-description "Um VPS baseado no ubuntu/focal64 para desenvolvimento do projeto NEORICALEX e NFDOS" \
					--version-description "Reduzir o tamanho" \
					neoricalex/ubuntu 0.0.3 virtualbox \
					vagrant-libs/base.box # --force --debug
				vagrant cloud auth logout
			else
				echo "[DEBUG] Para enviar a vagrant-libs/base.box para a Vagrant Cloud tem que ter as credenciais. Continuando..."
			fi

			echo "==> Excluir o VPS_DEV baseado no ubuntu/focal64 pois não é mais necessário..."
			VAGRANT_VAGRANTFILE=Vagrantfile.Ubuntu vagrant destroy -f
			vagrant box remove ubuntu/focal64 --provider virtualbox


		fi
		echo "==> A vagrant-libs/base.box foi gerada."
		echo "==> O VPS_DEV baseado no neoricalex/ubuntu está pronto para ser executado."
		echo "==> Provisionando o neoricalex/ubuntu (VPS_DEV)..."
		VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up
		echo "==> Reiniciando o neoricalex/ubuntu (VPS_DEV) para as configurações ficarem ativas..."
		VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant reload

	fi
	echo "==> A neoricalex/ubuntu (VPS_DEV) foi gerada."
}

instalar_requerimentos_para_rodar_vps
provisionar_vps

echo "==> Entrando no neoricalex/ubuntu (VPS_DEV)..."
VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<EOF
#!/bin/bash

cd /vagrant
make iso

if ! command -v vagrant &> /dev/null
then
	echo "Download Vagrant & Instalar"
	wget -nv https://releases.hashicorp.com/vagrant/2.2.9/vagrant_2.2.9_x86_64.deb
	sudo dpkg -i vagrant_2.2.9_x86_64.deb
	rm vagrant_2.2.9_x86_64.deb

	echo "Instalar plugins do Vagrant"
	vagrant plugin install vagrant-libvirt
	
fi

vagrant up

cd .. 
EOF

echo "==> A compilação do VPS_DEV foi concluída com sucesso!"
