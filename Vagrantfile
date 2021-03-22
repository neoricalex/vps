# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

	config.vm.define 'VPS_DEV'
  
    config.vm.define :vps do |vps|
		vps.vm.box = "ubuntu/bionic64"

        vps.vm.provider :libvirt do |domain|
            domain.memory = 4096
            domain.cpus = 3
        end

        vps.vm.provider :libvirt do |libvirt|
            libvirt.driver = "kvm"
            libvirt.storage_pool_name = "default"
            libvirt.default_prefix = ''
        end

    end
  
	config.vm.provision :shell,
		path: "vagrant-libs/bootstrap.sh"
		
	# Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
	# such as FTP and Heroku are also available. See the documentation at
	# https://docs.vagrantup.com/v2/push/atlas.html for more information.
	# config.push.define "atlas" do |push|
	#   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
	# end
  
end
  