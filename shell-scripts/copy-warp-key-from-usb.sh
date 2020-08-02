sudo rm -rf /media/adausb
sudo mkdir /media/adausb
sudo mount /dev/sda1 /media/adausb
cp /media/adausb/warp-key.json /home/pi/work/warptron/
sudo umount /media/adausb
