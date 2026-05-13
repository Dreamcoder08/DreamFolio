import React from 'react';
import { DossierCard } from '../ui/DossierCard';
import type { SystemUnit as SystemUnitType } from '../../data/systems';

interface Props {
  system: SystemUnitType;
}

export const SystemUnit: React.FC<Props> = ({ system }) => {
  return (
    <div className="w-full">
      <DossierCard system={system} />
    </div>
  );
};
