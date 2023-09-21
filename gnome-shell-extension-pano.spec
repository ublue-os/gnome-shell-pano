%global uuid pano@elhan.io

Name:        gnome-shell-extension-pano
Version:     {{{ git_dir_version }}}
Release:     1%{?dist}
Summary:     Next-gen Clipboard Manager for Gnome Shell 

Group:       User Interface/Desktops
License:     GPLv2
URL:         https://github.com/ublue-os/gnome-shell-extension-pano
Source0:     %{url}/archive/refs/heads/master.tar.gz
BuildArch:   noarch

Requires:    gnome-shell >= 3.12
Requires:    libgda
Requires:    libgda-sqlite

BuildRequires: cogl-devel
BuildRequires: gsound-devel
BuildRequires: libgda-devel
BuildRequires: yarn

%description
Next-gen Clipboard Manager for Gnome Shell 

%prep
%autosetup -n gnome-shell-extension-pano-master

%build
yarn install
yarn build

%install
mkdir -p %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
cp -r dist/* %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/

%files
%doc README.md
%license LICENSE
%{_datadir}/gnome-shell/extensions/%{uuid}/

%changelog
{{{ git_dir_changelog }}}