class CreateInterpItems < ActiveRecord::Migration
  def change
    create_table :interp_items do |t|
      t.string :name
      t.string :itemtype
      t.timestamps
    end
  end
end
