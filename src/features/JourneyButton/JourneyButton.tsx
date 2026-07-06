import { Button } from '@ui/Button';
import { openCampaignMap, syncEnergy } from '@state/campaignController';
import { useUi } from '@hooks/useUiStore';
import { LOCALES } from '../../game/i18n';

export function JourneyButton() {
  const lang = useUi((s) => s.menu.lang);
  const L = LOCALES[lang];
  return (
    <Button
      testId="journey"
      type="primary"
      size="large"
      block
      onClick={() => { syncEnergy(Date.now()); openCampaignMap(); }}
    >
      🗺 {L.journeyTitle}
    </Button>
  );
}
