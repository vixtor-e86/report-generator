ALTER TABLE templates ADD COLUMN IF NOT EXISTS referral_id TEXT;

CREATE OR REPLACE FUNCTION process_template_referral(p_referral_code TEXT, p_amount INTEGER, p_transaction_id UUID)
RETURNS VOID AS \$\$
DECLARE
    v_referrer_id UUID;
    v_commission INTEGER;
    v_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT id INTO v_referrer_id FROM user_profiles WHERE referral_code = p_referral_code;
    IF v_referrer_id IS NOT NULL THEN
        -- 10% of amount
        v_commission := (p_amount * 10) / 100;
        v_reset_date := get_next_friday_reset(NOW());
        
        INSERT INTO referral_commissions (referrer_id, referred_id, transaction_id, amount, commission_percentage, reset_at)
        VALUES (v_referrer_id, NULL, p_transaction_id, v_commission, 10, v_reset_date);
        
        UPDATE user_profiles 
        SET referral_weekly_earnings = referral_weekly_earnings + v_commission,
            referral_weekly_purchases = referral_weekly_purchases + 1
        WHERE id = v_referrer_id;
    END IF;
END;
\$\$ LANGUAGE plpgsql;

-- UPDATE process_referral_purchase to give 5% (was 10/15%)
CREATE OR REPLACE FUNCTION process_referral_purchase(p_referred_id UUID, p_amount INTEGER, p_transaction_id UUID) 
RETURNS VOID AS \$\$
DECLARE
    v_referrer_id UUID;
    v_referrer_role TEXT;
    v_percentage INTEGER;
    v_commission INTEGER;
    v_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT referred_by INTO v_referrer_id FROM user_profiles WHERE id = p_referred_id;
    IF v_referrer_id IS NOT NULL THEN
        SELECT role INTO v_referrer_role FROM user_profiles WHERE id = v_referrer_id;
        IF v_referrer_role = 'admin' THEN
            RETURN;
        END IF;
        
        -- NORMAL REFERRAL IS NOW 5% (User request)
        v_percentage := 5;
        v_commission := (p_amount * v_percentage) / 100;
        v_reset_date := get_next_friday_reset(NOW());
        
        INSERT INTO referral_commissions (referrer_id, referred_id, transaction_id, amount, commission_percentage, reset_at)
        VALUES (v_referrer_id, p_referred_id, p_transaction_id, v_commission, v_percentage, v_reset_date);
        
        UPDATE user_profiles 
        SET referral_weekly_earnings = referral_weekly_earnings + v_commission,
            referral_weekly_purchases = referral_weekly_purchases + 1
        WHERE id = v_referrer_id;
    END IF;
END;
\$\$ LANGUAGE plpgsql;
