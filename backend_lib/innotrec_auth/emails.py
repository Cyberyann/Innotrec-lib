"""Templated e-mails.

Templates live in ``templates/innotrec_auth/email/<name>.{subject.txt,txt,html}``.
Any host project can override them by providing a template with the same path
in its own ``templates`` directory (Django template resolution order).
"""

import logging
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from innotrec_auth.conf import AuthSettings, get_auth_settings

logger: logging.Logger = logging.getLogger(__name__)


def send_templated_mail(template: str, to: list[str], context: dict[str, Any]) -> None:
    conf: AuthSettings = get_auth_settings()
    full_context: dict[str, Any] = {
        "app_name": conf.APP_NAME,
        "frontend_url": conf.FRONTEND_URL,
        "support_email": conf.SUPPORT_EMAIL,
        **context,
    }
    base: str = f"innotrec_auth/email/{template}"
    subject: str = render_to_string(f"{base}.subject.txt", full_context).strip()
    text_body: str = render_to_string(f"{base}.txt", full_context)
    html_body: str = render_to_string(f"{base}.html", full_context)
    message: EmailMultiAlternatives = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to,
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)
    logger.info("Sent '%s' e-mail to %d recipient(s)", template, len(to))
