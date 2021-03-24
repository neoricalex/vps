# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
 
    config.vm.define :NFDOS do |vps|
		#vps.vm.define 'VPS_DEV'
		vps.vm.box = "neoricalex/nfdos"
		#vps.vm.box_version = "0.4.4"
		vps.vm.box_url = "nfdos/desktop/vagrant/libvirt/NFDOS-0.4.4.box"
		config.vm.synced_folder "./", "/home/neo/neoricalex", disabled: false

        vps.vm.provider :libvirt do |domain|
            domain.memory = 4096
            domain.cpus = 3
        end

        vps.vm.provider :libvirt do |libvirt|
            libvirt.driver = "kvm"
            libvirt.storage_pool_name = "default"
            libvirt.default_prefix = 'NEORICALEX_'
        end

    end

	config.ssh.username = "neo"
	config.ssh.password = "neoricalex"
	# config.ssh.insert_key = true
	# config.ssh.private_key_path = "./keys/priv.ppk"
	# config.ssh.keys_only = false
	#config.ssh.host = 'localhost'
	
	config.vm.provision :shell,
		path: "vagrant-libs/bootstrap.sh"


	# Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
	# such as FTP and Heroku are also available. See the documentation at
	# https://docs.vagrantup.com/v2/push/atlas.html for more information.
	# config.push.define "atlas" do |push|
	#   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
	# end
  
end
  