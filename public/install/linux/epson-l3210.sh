#!/usr/bin/env bash
set -Eeuo pipefail

# Rekaluna - Epson L3210 Linux printer setup
# Installs the CUPS printing stack and the distro-provided Epson ESC/P-R driver.
# It does not delete caches, change existing printer queues, or add a printer
# automatically. The final printer queue is created from the CUPS interface.

APP_NAME="Rekaluna Epson L3210 setup"
DRIVER_INSTALLED=0
DISTRO_ID="unknown"
DISTRO_LIKE=""

log()  { printf '\n\033[1;34m[rekaluna]\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m[warning]\033[0m %s\n' "$*" >&2; }
die()  { printf '\n\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

as_root() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

[[ "$(uname -s)" == "Linux" ]] || die "This installer only supports Linux."
[[ -r /etc/os-release ]] || die "Cannot identify this Linux distribution (/etc/os-release is missing)."

# Load distro identifiers without executing the file as shell code.
. /etc/os-release
DISTRO_ID="${ID:-unknown}"
DISTRO_LIKE="${ID_LIKE:-}"

if [[ "${EUID}" -ne 0 ]]; then
  command -v sudo >/dev/null 2>&1 || die "sudo is required. Install sudo, then run this script again."
  sudo -v || die "Could not obtain sudo permission."
fi

log "Preparing CUPS and printer support for ${PRETTY_NAME:-$DISTRO_ID}."

install_arch() {
  command -v pacman >/dev/null 2>&1 || die "pacman was not found."
  as_root pacman -S --needed --noconfirm base-devel cups cups-filters ghostscript gutenprint system-config-printer

  if command -v yay >/dev/null 2>&1; then
    log "Installing the Epson ESC/P-R driver with yay."
    [[ "${EUID}" -ne 0 ]] || die "Do not run an AUR helper as root. Run this script from your regular user account."
    yay -S --needed --noconfirm epson-inkjet-printer-escpr
    DRIVER_INSTALLED=1
  elif command -v paru >/dev/null 2>&1; then
    log "Installing the Epson ESC/P-R driver with paru."
    [[ "${EUID}" -ne 0 ]] || die "Do not run an AUR helper as root. Run this script from your regular user account."
    paru -S --needed --noconfirm epson-inkjet-printer-escpr
    DRIVER_INSTALLED=1
  else
    warn "CUPS is installed, but no AUR helper (yay/paru) was found. Install an AUR helper, then run this script again to install epson-inkjet-printer-escpr."
  fi
}

install_debian() {
  local apt
  apt="$(command -v apt-get || command -v apt || true)"
  [[ -n "$apt" ]] || die "APT was not found."
  as_root "$apt" update
  as_root "$apt" install -y cups cups-client cups-filters ghostscript system-config-printer printer-driver-escpr printer-driver-gutenprint
  DRIVER_INSTALLED=1
}

install_fedora() {
  local manager
  manager="$(command -v dnf || command -v yum || true)"
  [[ -n "$manager" ]] || die "DNF/YUM was not found."
  as_root "$manager" install -y cups cups-filters ghostscript system-config-printer gutenprint

  # This package is present in some RPM repositories, but not enabled everywhere.
  if as_root "$manager" install -y epson-inkjet-printer-escpr; then
    DRIVER_INSTALLED=1
  else
    warn "The Epson ESC/P-R package is not available in the enabled RPM repositories. CUPS is ready; use Epson's Linux download page for the matching RPM."
  fi
}

install_opensuse() {
  command -v zypper >/dev/null 2>&1 || die "zypper was not found."
  as_root zypper --non-interactive install cups cups-filters ghostscript system-config-printer gutenprint

  if as_root zypper --non-interactive install epson-inkjet-printer-escpr; then
    DRIVER_INSTALLED=1
  else
    warn "The Epson ESC/P-R package was not found in the enabled repositories. CUPS is ready; use Epson's Linux download page for the matching RPM."
  fi
}

case "$DISTRO_ID $DISTRO_LIKE" in
  *arch*|*manjaro*|*cachyos*)
    install_arch
    ;;
  *debian*|*ubuntu*|*linuxmint*|*pop*)
    install_debian
    ;;
  *fedora*|*rhel*|*centos*)
    install_fedora
    ;;
  *opensuse*|*suse*)
    install_opensuse
    ;;
  *)
    if command -v pacman >/dev/null 2>&1; then
      install_arch
    elif command -v apt-get >/dev/null 2>&1 || command -v apt >/dev/null 2>&1; then
      install_debian
    elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
      install_fedora
    elif command -v zypper >/dev/null 2>&1; then
      install_opensuse
    else
      die "Unsupported package manager. Supported families: Arch, Debian/Ubuntu, Fedora/RHEL, and openSUSE. CUPS and the Epson ESC/P-R driver can still be installed manually."
    fi
    ;;
esac

log "Enabling the CUPS printing service."
if command -v systemctl >/dev/null 2>&1; then
  as_root systemctl enable --now cups.service || as_root systemctl enable --now cupsd.service
  as_root systemctl restart cups.service 2>/dev/null || as_root systemctl restart cupsd.service
elif command -v rc-service >/dev/null 2>&1 && command -v rc-update >/dev/null 2>&1; then
  as_root rc-update add cupsd default || true
  as_root rc-service cupsd restart || as_root rc-service cupsd start
else
  warn "CUPS packages are installed, but this init system was not recognized. Start the CUPS service using your distribution's service manager."
fi

printf '\n============================================================\n'
printf '  Rekaluna - Epson L3210 Linux printer setup\n'
printf '============================================================\n'

if [[ "$DRIVER_INSTALLED" -eq 1 ]]; then
  printf '  Epson ESC/P-R driver installation: attempted successfully\n'
else
  printf '  Epson ESC/P-R driver installation: needs a manual step\n'
fi

printf '\n'
if command -v lpstat >/dev/null 2>&1 && lpstat -r 2>/dev/null | grep -qi 'scheduler is running'; then
  printf '  CUPS status: running\n'
else
  printf '  CUPS status: check the service manager\n'
fi

printf '\n'
printf '  Next steps:\n'
printf '  1. Connect or power on the Epson L3210.\n'
printf '  2. Open http://localhost:631 in your browser.\n'
printf '  3. Go to Administration > Add Printer and select the device.\n'
printf '  4. Choose the Epson ESC/P-R driver when it is offered.\n'
printf '  5. If L3210 is not listed, try "Epson L3250 Series" as\n'
printf '     the model profile, as reported to work for this setup.\n'
printf '\n'

if command -v lpinfo >/dev/null 2>&1; then
  MODEL_MATCHES="$(lpinfo -m 2>/dev/null | grep -Ei 'L3210|L3250' | head -n 8 || true)"
  if [[ -n "$MODEL_MATCHES" ]]; then
    printf '  Matching installed model profiles:\n%s\n\n' "$MODEL_MATCHES"
  else
    warn "No L3210/L3250 profile was found in the current driver list. Check the official Epson Linux download page for your exact model."
  fi
fi

printf '  Epson Linux drivers: https://download.ebz.epson.net/dsc/search/01/search/?OSC=LX\n'
printf '  CUPS documentation: https://openprinting.github.io/cups/\n'
printf '============================================================\n'
