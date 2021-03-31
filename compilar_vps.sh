#!/bin/bash

echo "==> Provisionando o VPS_DEV..."
VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant up

VAGRANT_VAGRANTFILE=Vagrantfile.VPS_DEV vagrant ssh<<ENTRAR_VPS
#!/bin/bash

cd /neoricalex
ls vagrant-libs/ssh/segura
touch teste.sh
ENTRAR_VPS
