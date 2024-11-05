#! /usr/bin/env bash

set -e

echo ""

if [ -z "${1}" ]; then
  echo "Usage: ${0##*/} <git-repo-url>"
  exit 1
fi


echo "Renaming 'origin' to 'upstream'"
git remote rename "origin" "upstream"
echo ""

echo "Disable pushing to 'upstream'"
git remote set-url --push "upstream" "DO.NOT.PUSH.TO.UPSTREAM"
echo ""


echo "Renaming 'main' branch to 'upstream/main'"
git pull "upstream" "main"
git checkout "main"
git branch --move "main" "upstream/main"
echo ""

echo "Renaming 'development' branch to 'upstream/development'"
git pull "upstream" "development"
git checkout "development"
git branch --move "development" "upstream/development"
echo ""


echo "Adding new 'origin'"
git remote add origin "${1}"
echo ""


echo "Creating new 'main' branch"
git checkout "upstream/main"
git checkout -b "main"
echo ""

echo "Pushing new 'main' branch to 'origin'"
git push --set-upstream origin main
echo ""


echo "Creating new 'development' branch"
git checkout "upstream/development"
git checkout -b "development"
echo ""

echo "Pushing new 'development' branch to 'origin'"
git push --set-upstream origin development
echo ""


echo "Setting up the project-level environment variables"
cp .env.example .env

echo "Setting up the client environment variables"
cp ./apps/client/.env.example ./apps/client/.env
cp ./apps/client/.env.example ./apps/client/.env.test
echo ""


echo "!!!!!!!!!!!!!!!!!!!!"
echo "!! Setup Complete !!"
echo "!!!!!!!!!!!!!!!!!!!!"
