#! /bin/bash

input="./manifest-beta.json"

while IFS= read -r line
do
	if [[ $line == *"version"* ]]; then
		[[ $line =~ \"([0-9]*\.[0-9]*\.[0-9]*)\" ]] &&
		echo ${BASH_REMATCH[1]}
	fi
done < "$input"

sed -i "/version/ c\    \"version\": \"${BASH_REMATCH[1]}\"," ./manifest.json

read  -n 1 -p "Press any key to close" mainmenuinput