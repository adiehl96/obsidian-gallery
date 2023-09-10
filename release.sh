#! /bin/bash

input="./manifest.json"

while IFS= read -r line
do
	if [[ $line == *"version"* ]]; then
		[[ $line =~ \"([0-9]*\.[0-9]*\.[0-9]*)\" ]] &&
		echo ${BASH_REMATCH[1]}
		git tag -a ${BASH_REMATCH[1]} -m "${BASH_REMATCH[1]}"
		git push origin "${BASH_REMATCH[1]}"
	fi
done < "$input"