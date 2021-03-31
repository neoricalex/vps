# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
# REF: https://www.rubydoc.info/gems/vagrant-libvirt/0.0.28

	config.ssh.pty = true
	config.vagrant.plugins = "vagrant-libvirt"
 
    config.vm.define :NFDOS do |vps|
		vps.vm.box = "neoricalex/nfdos"
		#vps.vm.box_version = "0.4.4"
		#vps.vm.box_url = "nfdos/desktop/vagrant/libvirt/NFDOS-0.4.5.box"
		vps.vm.synced_folder "./", "/vagrant", disabled: true
		#vps.vm.synced_folder "./", "/nfdos", disabled: false
		vps.vm.hostname = "nfdos"
		#vps.vm.network :public_network, :dev => "virbr0", :mode => "bridge", :type => "bridge"
		#vps.ssh.pty = true

        vps.vm.provider :libvirt do |domain|
			domain.memory = 2048
			domain.cpus = 2
			domain.nested = true
			domain.keymap = "pt-br"
			#domain.disk_driver :cache => 'none'
			domain.storage :file, :size => '10G', :type => 'qcow2'
        end

        vps.vm.provider :libvirt do |libvirt|
            libvirt.driver = "kvm"
            libvirt.storage_pool_name = "default"
            libvirt.default_prefix = 'NEORICALEX_'
			libvirt.nested = true
			libvirt.machine_arch = "x86_64"
			#libvirt.machine_virtual_size = "10GB"
			#libvirt.storage :file, :size => '10G', :bus => 'scsi', :type => 'qcow2', :discard => 'unmap', :detect_zeroes => 'on'
			libvirt.emulator_path = "/usr/bin/qemu-system-x86_64"
			libvirt.autostart = false
			libvirt.watchdog :model => 'i6300esb', :action => 'reset'
			libvirt.graphics_port = 5901
			libvirt.graphics_ip = '0.0.0.0'
			libvirt.video_type = 'cirrus'
        end

    end

	config.ssh.username = "neo"
	config.ssh.password = "neoricalex"
	config.ssh.insert_key = false
	# config.ssh.private_key_path = "./keys/priv.ppk"
	# config.ssh.keys_only = false
	#config.ssh.host = 'localhost'
	
	#config.vm.provision :shell,
	#	path: "nfdos/desktop/late_command.nfdos"


	# Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
	# such as FTP and Heroku are also available. See the documentation at
	# https://docs.vagrantup.com/v2/push/atlas.html for more information.
	# config.push.define "atlas" do |push|
	#   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
	# end
  
end
  